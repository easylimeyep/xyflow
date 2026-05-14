import { addEdge } from "@xyflow/react"

import {
  applyAddNodeCommand,
  applyUpdateNodeConfigCommand,
  applyUpdateNodeLabelCommand,
} from "../../graph-engine"
import { refactorPlainVariableReferencesInGraph } from "../graph-refactors"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { normalizeNodeConfig } from "../../node-registry/node-config-normalization"
import type { NodeKind } from "../../node-registry/registry"
import type { WorkflowEdge, WorkflowNode } from "../../types/types"
import {
  buildExpressionSlicePatch,
  deduplicateNodeLabels,
} from "../helpers"
import { commitGraphState } from "../history-helpers"
import { projectSelectionToNodes } from "../selection-sync"
import type { WorkflowSliceCreator } from "../types"

const DUPLICATE_NODE_OFFSET = 40
const VARIABLE_LABEL_KINDS = new Set(["extractor", "setVariable"])

export const createNodeCrudSlice: WorkflowSliceCreator = (set, get) => ({
  addNode: (kind, position) => {
    const currentGraph = get().history.present
    const result = applyAddNodeCommand(currentGraph, { kind, position })
    if (!result.ok) {
      set({ lastError: result.error })
      return
    }
    commitGraphState(set, result.nextGraph)
    get().hideGlobalValidation()
    set({ lastError: null })
  },
  duplicateNodes: (nodeIds) => {
    const state = get()
    const currentGraph = state.history.present
    const targetNodeIds = normalizeTargetNodeIds(
      nodeIds ?? state.selectedNodeIds,
      currentGraph.nodes
    )
    if (targetNodeIds.length === 0) {
      return false
    }

    const targetNodeIdSet = new Set(targetNodeIds)
    const selectedNodes = currentGraph.nodes.filter((node) =>
      targetNodeIdSet.has(node.id)
    )
    const existingLabels = new Set(
      currentGraph.nodes.map((node) => node.data.label.trim()).filter(Boolean)
    )
    const { nodes: duplicatedNodes, nodeIdMap } = buildDuplicatedNodes(
      selectedNodes,
      existingLabels
    )
    const duplicatedNodeById = new Map(
      duplicatedNodes.map((node) => [node.id, node])
    )
    const duplicatedEdges = currentGraph.edges.reduce<WorkflowEdge[]>(
      (nextEdges, edge) => {
        const source = nodeIdMap.get(edge.source)
        const target = nodeIdMap.get(edge.target)
        if (!source || !target) {
          return nextEdges
        }

        const sourceNode = duplicatedNodeById.get(source)
        const targetNode = duplicatedNodeById.get(target)
        if (!sourceNode || !targetNode) {
          return nextEdges
        }

        return addEdge(
          {
            source,
            target,
            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,
            data: {
              sourceKind: sourceNode.data.kind,
              targetKind: targetNode.data.kind,
            },
          },
          nextEdges
        ) as WorkflowEdge[]
      },
      currentGraph.edges
    )
    const duplicatedNodeIds = duplicatedNodes.map((node) => node.id)
    const nextGraph = {
      ...currentGraph,
      nodes: projectSelectionToNodes(
        [...currentGraph.nodes, ...duplicatedNodes],
        duplicatedNodeIds
      ),
      edges: duplicatedEdges,
    }

    commitGraphState(set, nextGraph)
    set((nextState) => ({
      selectedNodeIds: duplicatedNodeIds,
      lastError: null,
      ...buildExpressionSlicePatch(nextState, nextState.history.present),
    }))
    get().hideGlobalValidation()
    return true
  },
  deleteNodes: (nodeIds) => {
    const state = get()
    const targetNodeIds = normalizeTargetNodeIds(
      nodeIds ?? state.selectedNodeIds,
      state.history.present.nodes
    )
    if (targetNodeIds.length === 0) {
      return false
    }

    state.onNodesChange(
      targetNodeIds.map((nodeId) => ({ id: nodeId, type: "remove" }))
    )
    return true
  },
  updateNodeLabel: (nodeId, nextLabel) => {
    const currentGraph = get().history.present
    const result = applyUpdateNodeLabelCommand(currentGraph, { nodeId, nextLabel })
    if (!result.ok) {
      set({ lastError: result.error })
      return
    }
    if (result.nextGraph === currentGraph) {
      return
    }
    commitGraphState(set, result.nextGraph)
    get().hideValidationForNode(nodeId)
    set({ lastError: null })
  },
  updateNodeConfig: (nodeId, update) => {
    const currentGraph = get().history.present
    const result = applyUpdateNodeConfigCommand(currentGraph, { nodeId, update })
    if (!result.ok) {
      set({ lastError: result.error })
      return
    }
    if (result.nextGraph === currentGraph) {
      return
    }
    commitGraphState(set, result.nextGraph)
    get().hideValidationForNode(nodeId)
    set({ lastError: null })
  },
})

function normalizeTargetNodeIds(
  nodeIds: string[],
  nodes: WorkflowNode[]
): string[] {
  const existingNodeIds = new Set(nodes.map((node) => node.id))
  const normalizedNodeIds: string[] = []
  const seenNodeIds = new Set<string>()

  nodeIds.forEach((nodeId) => {
    if (!existingNodeIds.has(nodeId) || seenNodeIds.has(nodeId)) {
      return
    }
    seenNodeIds.add(nodeId)
    normalizedNodeIds.push(nodeId)
  })

  return normalizedNodeIds
}

function buildDuplicatedNodes(
  nodes: WorkflowNode[],
  existingLabels: Set<string>
): { nodes: WorkflowNode[]; nodeIdMap: Map<string, string> } {
  const nodeIdMap = new Map<string, string>()
  const createdNodes = nodes.map((node) => {
    const kind = node.data.kind as NodeKind
    const nextNode = createWorkflowNode(
      kind,
      {
        x: node.position.x + DUPLICATE_NODE_OFFSET,
        y: node.position.y + DUPLICATE_NODE_OFFSET,
      },
      node.data.label
    )

    nextNode.data = {
      kind,
      label: node.data.label,
      config: normalizeNodeConfig(kind, node.data.config),
    }
    nodeIdMap.set(node.id, nextNode.id)
    return nextNode
  })

  const kindByOldLabel = new Map(
    createdNodes.map((node) => [node.data.label, node.data.kind])
  )
  const { nodes: nodesWithUniqueLabels, renames } = deduplicateNodeLabels(
    createdNodes,
    existingLabels
  )
  let duplicatedNodes = nodesWithUniqueLabels

  renames.forEach((rename) => {
    const kind = kindByOldLabel.get(rename.oldLabel) ?? ""
    if (!VARIABLE_LABEL_KINDS.has(kind)) {
      return
    }

    duplicatedNodes = refactorPlainVariableReferencesInGraph(
      duplicatedNodes,
      rename.oldLabel,
      rename.newLabel
    )
  })

  return { nodes: duplicatedNodes, nodeIdMap }
}
