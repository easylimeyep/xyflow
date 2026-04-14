import { addEdge, applyNodeChanges } from "@xyflow/react"
import type { NodeChange, XYPosition } from "@xyflow/react"

import type { NodeKind } from "../node-registry/registry"
import { getNodeDefinition } from "../node-registry/registry"
import { createWorkflowError, type WorkflowError } from "../types/errors"
import type {
  JsonObject,
  WorkflowGraphState,
  WorkflowEdge,
  WorkflowNode,
} from "../types/types"
import {
  getKindsFromConnection,
  validateConnection,
  type ConnectionLike,
} from "../validation/validation"
import { toEdgeConnectionWithKind } from "../store/dto-mappers"
import { computeEdgeInsertion } from "../store/edge-insertion"
import type { NodeConfigUpdate } from "../store/types"
import { refactorPlainVariableReferencesInGraph } from "../expression/refactor/refactor"
import {
  filterEdgesForRemovedNodes,
  getRemovedNodeIds,
  hasEdgeCollectionChanged,
  hasNodeCollectionChanged,
  haveSameIdSet,
} from "../store/collection-diff"
import { projectSelectionToNodes } from "../store/selection-sync"

import { runNodeConfigHooks } from "./hooks"
import {
  createNodeWithUniqueLabel,
  isVariableLabelKind,
  resolveNodeLabelUpdate,
} from "./node-labels"

export interface AddNodeCommand {
  kind: NodeKind
  position: XYPosition
  nodeId?: string
}

export interface UpdateNodeLabelCommand {
  nodeId: string
  nextLabel: string
}

export interface UpdateNodeConfigCommand {
  nodeId: string
  update: NodeConfigUpdate
}

export interface ConnectNodesCommand {
  connection: ConnectionLike
}

export interface InsertNodeOnEdgeCommand {
  edgeId: string
  kind: NodeKind
  nodeId?: string
}

export interface ApplyNodeChangesCommand {
  changes: NodeChange<WorkflowNode>[]
  selectedNodeIds: string[]
}

export interface GraphEngineSuccess {
  ok: true
  nextGraph: WorkflowGraphState
}

export interface GraphEngineFailure {
  ok: false
  error: WorkflowError
}

export type GraphEngineResult = GraphEngineSuccess | GraphEngineFailure

export interface ApplyNodeChangesSuccess extends GraphEngineSuccess {
  removedNodeIds: Set<string>
  nodeCollectionChanged: boolean
  edgeCollectionChanged: boolean
  nextSelectedNodeIds: string[]
  selectionChanged: boolean
}

export function applyAddNodeCommand(
  currentGraph: WorkflowGraphState,
  command: AddNodeCommand,
  createNode: (
    currentNodes: WorkflowNode[],
    kind: NodeKind,
    position: XYPosition,
    nodeId?: string
  ) => WorkflowNode = createNodeWithUniqueLabel
): GraphEngineResult {
  const nextNode = createNode(
    currentGraph.nodes,
    command.kind,
    command.position,
    command.nodeId
  )
  return {
    ok: true,
    nextGraph: {
      ...currentGraph,
      nodes: [...currentGraph.nodes, nextNode],
    },
  }
}

export function applyUpdateNodeLabelCommand(
  currentGraph: WorkflowGraphState,
  command: UpdateNodeLabelCommand
): GraphEngineResult {
  const targetNode = currentGraph.nodes.find((node) => node.id === command.nodeId)
  if (!targetNode) {
    return {
      ok: false,
      error: createWorkflowError("NODE_NOT_FOUND", "Failed to resolve node for label update."),
    }
  }

  const labelResult = resolveNodeLabelUpdate(
    currentGraph.nodes,
    command.nodeId,
    command.nextLabel
  )
  if (labelResult.error) {
    return { ok: false, error: labelResult.error }
  }
  if (!labelResult.nextLabel || labelResult.nextLabel === targetNode.data.label) {
    return { ok: true, nextGraph: currentGraph }
  }

  const nextNodes = currentGraph.nodes.map((node) =>
    node.id === command.nodeId
      ? {
          ...node,
          data: {
            ...node.data,
            label: labelResult.nextLabel!,
          },
        }
      : node
  )

  const nextNodesWithHooks = isVariableLabelKind(targetNode.data.kind as NodeKind)
    ? refactorPlainVariableReferencesInGraph(
        nextNodes,
        targetNode.data.label,
        labelResult.nextLabel
      )
    : nextNodes

  return {
    ok: true,
    nextGraph: {
      ...currentGraph,
      nodes: nextNodesWithHooks,
    },
  }
}

export function applyUpdateNodeConfigCommand(
  currentGraph: WorkflowGraphState,
  command: UpdateNodeConfigCommand
): GraphEngineResult {
  const targetNode = currentGraph.nodes.find((node) => node.id === command.nodeId)
  if (!targetNode) {
    return {
      ok: false,
      error: createWorkflowError("NODE_NOT_FOUND", "Failed to resolve node for config update."),
    }
  }

  if (targetNode.data.kind !== command.update.kind) {
    return {
      ok: false,
      error: createWorkflowError(
        "INVALID_NODE_CONFIG_KIND",
        `Cannot update ${targetNode.data.kind} node with ${command.update.kind} config payload.`
      ),
    }
  }

  const definition = getNodeDefinition(targetNode.data.kind as NodeKind)
  const defaultConfig = definition.buildDefaultConfig()
  if (!(command.update.key in defaultConfig)) {
    return {
      ok: false,
      error: createWorkflowError(
        "INVALID_NODE_CONFIG_KEY",
        `Node kind ${targetNode.data.kind} does not support config key ${command.update.key}.`
      ),
    }
  }
  if (
    definition.validateConfigValue &&
    !definition.validateConfigValue(command.update.key, command.update.value)
  ) {
    return {
      ok: false,
      error: createWorkflowError(
        "INVALID_NODE_CONFIG_VALUE",
        `Invalid value for ${targetNode.data.kind}.${command.update.key}.`
      ),
    }
  }

  const previousValue = targetNode.data.config[
    command.update.key as keyof typeof targetNode.data.config
  ]
  if (Object.is(previousValue, command.update.value)) {
    return { ok: true, nextGraph: currentGraph }
  }

  const nextNodes = currentGraph.nodes.map((node) =>
    node.id === command.nodeId
      ? {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              [command.update.key]: command.update.value,
            } as JsonObject,
          },
        }
      : node
  )

  const hookResult = runNodeConfigHooks(nextNodes, currentGraph.edges, {
    targetNode,
    update: command.update,
    previousValue,
  })

  return {
    ok: true,
    nextGraph: {
      ...currentGraph,
      nodes: hookResult.nextNodes,
      edges: hookResult.nextEdges,
    },
  }
}

export function applyConnectNodesCommand(
  currentGraph: WorkflowGraphState,
  command: ConnectNodesCommand
): GraphEngineResult {
  const validation = validateConnection(
    command.connection,
    currentGraph.nodes,
    currentGraph.edges
  )
  if (!validation.valid) {
    return {
      ok: false,
      error: createWorkflowError(
        "INVALID_CONNECTION",
        validation.reason ?? "Invalid connection."
      ),
    }
  }

  const kinds = getKindsFromConnection(command.connection, currentGraph.nodes)
  if (!kinds) {
    return {
      ok: false,
      error: createWorkflowError(
        "KIND_RESOLUTION_FAILED",
        "Failed to resolve node kinds for connection."
      ),
    }
  }

  const nextEdges = addEdge(
    toEdgeConnectionWithKind(command.connection, kinds.sourceKind, kinds.targetKind),
    currentGraph.edges
  ) as WorkflowEdge[]

  return {
    ok: true,
    nextGraph: {
      ...currentGraph,
      edges: nextEdges,
    },
  }
}

export function applyInsertNodeOnEdgeCommand(
  currentGraph: WorkflowGraphState,
  command: InsertNodeOnEdgeCommand
): GraphEngineResult {
  const result = computeEdgeInsertion(
    currentGraph,
    command.edgeId,
    command.kind,
    (currentNodes, kind, position) =>
      createNodeWithUniqueLabel(currentNodes, kind, position, command.nodeId)
  )

  if (!result.ok) {
    return {
      ok: false,
      error: createWorkflowError("EDGE_INSERT_FAILED", result.error),
    }
  }

  return {
    ok: true,
    nextGraph: {
      ...currentGraph,
      nodes: result.nextNodes,
      edges: result.nextEdges,
    },
  }
}

export function applyNodeChangesCommand(
  currentGraph: WorkflowGraphState,
  command: ApplyNodeChangesCommand
): ApplyNodeChangesSuccess {
  const rawNextNodes = applyNodeChanges(command.changes, currentGraph.nodes)
  const removedNodeIds = getRemovedNodeIds(command.changes)
  const nextEdges = filterEdgesForRemovedNodes(currentGraph.edges, removedNodeIds)
  const remainingNodeIds = new Set(rawNextNodes.map((node) => node.id))
  const nextSelectedNodeIds = command.selectedNodeIds.filter((id) => remainingNodeIds.has(id))
  const nextNodes = projectSelectionToNodes(rawNextNodes, nextSelectedNodeIds)
  const nextGraph = { ...currentGraph, nodes: nextNodes, edges: nextEdges }

  return {
    ok: true,
    nextGraph,
    removedNodeIds,
    nodeCollectionChanged: hasNodeCollectionChanged(currentGraph.nodes, nextNodes),
    edgeCollectionChanged: hasEdgeCollectionChanged(currentGraph.edges, nextEdges),
    nextSelectedNodeIds,
    selectionChanged: !haveSameIdSet(command.selectedNodeIds, nextSelectedNodeIds),
  }
}
