import { refactorPlainVariableReferencesInGraph } from "../graph-refactors"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { isValidJsIdentifier } from "../../expression/variable-name/variable-name"
import { createWorkflowError } from "../../types/errors"
import type { WorkflowNode } from "../../types/types"
import { commitGraphState } from "../history-helpers"
import { applyNodeConfigUpdate } from "../node-config-updates"
import { createUniqueJsIdentifier, createUniqueLabel } from "../naming"
import type { WorkflowSliceCreator } from "../types"

const VARIABLE_LABEL_KINDS = new Set(["extractor", "setVariable"])

export const createNodeCrudSlice: WorkflowSliceCreator = (set, get) => ({
  addNode: (kind, position) => {
    const currentGraph = get().history.present
    const nextNode = createNodeWithUniqueLabel(currentGraph.nodes, kind, position)
    commitGraphState(set, {
      ...currentGraph,
      nodes: [...currentGraph.nodes, nextNode],
    })
  },
  updateNodeLabel: (nodeId, nextLabel) => {
    const currentGraph = get().history.present
    const targetNode = currentGraph.nodes.find((node) => node.id === nodeId)
    if (!targetNode) return

    const normalizedLabel = nextLabel.trim() || targetNode.data.label.trim() || "Node"

    if (VARIABLE_LABEL_KINDS.has(targetNode.data.kind)) {
      if (!isValidJsIdentifier(normalizedLabel)) {
        set({
          lastError: createWorkflowError(
            "INVALID_VARIABLE_NAME",
            "Node label must be a valid JavaScript identifier (no spaces or special characters)."
          ),
        })
        return
      }
    }

    const usedLabels = new Set(
      currentGraph.nodes
        .filter((node) => node.id !== nodeId)
        .map((node) => node.data.label.trim())
        .filter((label) => label.length > 0)
    )
    const uniqueLabel = VARIABLE_LABEL_KINDS.has(targetNode.data.kind)
      ? createUniqueJsIdentifier(normalizedLabel, usedLabels)
      : createUniqueLabel(normalizedLabel, usedLabels)
    if (targetNode.data.label === uniqueLabel) return

    const nextNodesWithLabel = currentGraph.nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, label: uniqueLabel } }
        : node
    )

    const nextNodes = VARIABLE_LABEL_KINDS.has(targetNode.data.kind)
      ? refactorPlainVariableReferencesInGraph(
          nextNodesWithLabel,
          targetNode.data.label,
          uniqueLabel
        )
      : nextNodesWithLabel

    commitGraphState(set, { ...currentGraph, nodes: nextNodes })
    set({ lastError: null })
  },
  updateNodeConfig: (nodeId, update) => {
    const currentGraph = get().history.present
    const result = applyNodeConfigUpdate(currentGraph, nodeId, update)
    if (result.error) {
      set({ lastError: result.error })
      return
    }
    if (!result.nextGraph) return
    commitGraphState(set, result.nextGraph)
    set({ lastError: null })
  },
})

export function createNodeWithUniqueLabel(
  currentNodes: WorkflowNode[],
  kind: Parameters<typeof createWorkflowNode>[0],
  position: Parameters<typeof createWorkflowNode>[1]
): WorkflowNode {
  const nextNode = createWorkflowNode(kind, position)
  const usedLabels = new Set(
    currentNodes
      .map((node) => node.data.label.trim())
      .filter((label) => label.length > 0)
  )
  const uniqueLabel = VARIABLE_LABEL_KINDS.has(kind)
    ? createUniqueJsIdentifier(nextNode.data.label, usedLabels)
    : createUniqueLabel(nextNode.data.label, usedLabels)
  if (uniqueLabel === nextNode.data.label) {
    return nextNode
  }
  return {
    ...nextNode,
    data: {
      ...nextNode.data,
      label: uniqueLabel,
    },
  }
}
