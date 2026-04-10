import { getNodeDefinition } from "../node-registry/registry"
import type { NodeKind } from "../node-registry/registry"
import { createWorkflowError, type WorkflowError } from "../types/errors"
import type { JsonObject, WorkflowGraphState } from "../types/types"
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

  const nextNodes = currentGraph.nodes.map((node) => {
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
