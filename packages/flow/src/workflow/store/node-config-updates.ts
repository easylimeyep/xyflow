import { refactorVariableReferencesInGraph } from "./graph-refactors"
import { isValidJsIdentifier } from "../expression/variable-name/variable-name"
import { getNodeDefinition } from "../node-registry/registry"
import type { NodeKind } from "../node-registry/registry"
import { createWorkflowError, type WorkflowError } from "../types/errors"
import type { JsonObject, WorkflowGraphState, WorkflowNode } from "../types/types"
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

  const def = getNodeDefinition(targetNode.data.kind as NodeKind)
  if (
    def.renameConfigKey &&
    update.key === def.renameConfigKey &&
    typeof update.value === "string"
  ) {
    return applyRenameableFieldUpdate(currentGraph, targetNode, nodeId, update.value)
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

function applyRenameableFieldUpdate(
  currentGraph: WorkflowGraphState,
  targetNode: WorkflowNode,
  nodeId: string,
  rawName: string
): NodeConfigUpdateResult {
  const def = getNodeDefinition(targetNode.data.kind as NodeKind)
  const renameKey = def.renameConfigKey!
  const previousNameValue = targetNode.data.config[renameKey]
  const previousName = typeof previousNameValue === "string" ? previousNameValue.trim() : ""
  const nextName = rawName.trim()
  if (nextName === previousName) {
    return { nextGraph: null, error: null }
  }

  if (!isValidJsIdentifier(nextName)) {
    return {
      nextGraph: null,
      error: createWorkflowError(
        "INVALID_VARIABLE_NAME",
        "Variable name must be a valid JavaScript identifier."
      ),
    }
  }

  const duplicateVariable = currentGraph.nodes.some((node) => {
    if (node.id === nodeId || node.data.kind !== targetNode.data.kind) {
      return false
    }
    const variableNameValue = node.data.config[renameKey]
    if (typeof variableNameValue !== "string") return false
    return variableNameValue.trim() === nextName
  })

  if (duplicateVariable) {
    return {
      nextGraph: null,
      error: createWorkflowError(
        "DUPLICATE_VARIABLE_NAME",
        "Variable name must be unique in this workflow."
      ),
    }
  }

  const nextNodesWithNewName = currentGraph.nodes.map((node) => {
    if (node.id !== nodeId) return node
    return {
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          [renameKey]: nextName,
        },
      },
    }
  })

  const nextNodes = refactorVariableReferencesInGraph(nextNodesWithNewName, {
    sourceNodeLabel: targetNode.data.label,
    oldName: previousName,
    newName: nextName,
  })

  return {
    nextGraph: {
      ...currentGraph,
      nodes: nextNodes,
    },
    error: null,
  }
}
