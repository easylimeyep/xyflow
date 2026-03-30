import { refactorVariableReferencesInGraph } from "../expression/refactor/refactor"
import { isValidJsIdentifier } from "../expression/variable-name/variable-name"
import { createWorkflowError, type WorkflowError } from "../types/errors"
import type { WorkflowGraphState, WorkflowNode } from "../types/types"
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

  if (
    update.kind === "setVariable" &&
    update.key === "variableName" &&
    typeof update.value === "string"
  ) {
    return applySetVariableRename(currentGraph, targetNode, nodeId, update.value)
  }

  const previousRawValue = targetNode.data.config[update.key as keyof typeof targetNode.data.config]
  if (Object.is(previousRawValue, update.value)) {
    return { nextGraph: null, error: null }
  }

  const nextNodes = currentGraph.nodes.map((node) => {
    if (node.id !== nodeId) return node
    return {
      ...node,
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          [update.key]: update.value,
        },
      },
    }
  })

  return {
    nextGraph: {
      ...currentGraph,
      nodes: nextNodes,
    },
    error: null,
  }
}

function applySetVariableRename(
  currentGraph: WorkflowGraphState,
  targetNode: WorkflowNode,
  nodeId: string,
  rawName: string
): NodeConfigUpdateResult {
  const previousNameValue = targetNode.data.config.variableName
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
    if (node.id === nodeId || node.data.kind !== "setVariable") {
      return false
    }
    const variableNameValue = node.data.config.variableName
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
          variableName: nextName,
        },
      },
    }
  })

  const nextNodes = refactorVariableReferencesInGraph(nextNodesWithNewName, {
    sourceNodeId: nodeId,
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
