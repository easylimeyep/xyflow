import { getNodeDefinition } from "../node-registry/registry"
import type { NodeKind } from "../node-registry/registry"
import { createWorkflowError, type WorkflowError } from "../types/errors"
import type { JsonObject, WorkflowGraphState } from "../types/types"
import { refactorPlainVariableReferencesInGraph } from "./graph-refactors"
import type { NodeConfigUpdate } from "./types"

interface NodeConfigUpdateResult {
  nextGraph: WorkflowGraphState | null
  error: WorkflowError | null
}

export function applyNodeConfigUpdate(
  currentGraph: WorkflowGraphState,
  nodeId: string,
  update: NodeConfigUpdate
): NodeConfigUpdateResult {
  const targetNode = currentGraph.nodes.find((node) => node.id === nodeId)
  if (!targetNode) {
    return { nextGraph: null, error: null }
  }

  if (targetNode.data.kind !== update.kind) {
    return {
      nextGraph: null,
      error: createWorkflowError(
        "INVALID_NODE_CONFIG_KIND",
        `Cannot update ${targetNode.data.kind} node with ${update.kind} config payload.`
      ),
    }
  }

  const previousRawValue = targetNode.data.config[update.key as keyof typeof targetNode.data.config]
  if (Object.is(previousRawValue, update.value)) {
    return { nextGraph: null, error: null }
  }

  const shouldPruneIncomingEdges =
    targetNode.data.kind === "inlineExpression" &&
    update.key === "isRoot" &&
    previousRawValue !== true &&
    update.value === true
  const definition = getNodeDefinition(targetNode.data.kind as NodeKind)
  const oldName = typeof previousRawValue === "string" ? previousRawValue : null
  const newName = typeof update.value === "string" ? update.value : null
  const isRenameFieldUpdate =
    definition.renameConfigKey === update.key &&
    oldName !== null &&
    newName !== null

  const nextNodesWithConfig = currentGraph.nodes.map((node) => {
    if (node.id !== nodeId) return node
    return {
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          [update.key]: update.value,
        } as JsonObject,
      },
    }
  })
  const nextNodes = isRenameFieldUpdate
    ? refactorPlainVariableReferencesInGraph(
        nextNodesWithConfig,
        oldName,
        newName
      )
    : nextNodesWithConfig

  return {
    nextGraph: {
      ...currentGraph,
      nodes: nextNodes,
      edges: shouldPruneIncomingEdges
        ? currentGraph.edges.filter((edge) => edge.target !== nodeId)
        : currentGraph.edges,
    },
    error: null,
  }
}
