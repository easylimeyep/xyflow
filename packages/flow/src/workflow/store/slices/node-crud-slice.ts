import { refactorNodeReferencesInGraph } from "../graph-refactors"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { createWorkflowError } from "../../types/errors"
import type { WorkflowNode } from "../../types/types"
import { commitGraphState } from "../history-helpers"
import { applyNodeConfigUpdate } from "../node-config-updates"
import { createUniqueLabel } from "../naming"
import type { WorkflowSliceCreator } from "../types"

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
    const usedLabels = new Set(
      currentGraph.nodes
        .filter((node) => node.id !== nodeId)
        .map((node) => node.data.label.trim())
        .filter((label) => label.length > 0)
    )
    const uniqueLabel = createUniqueLabel(normalizedLabel, usedLabels)
    if (targetNode.data.label === uniqueLabel) return

    const nextNodesWithLabel = currentGraph.nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, label: uniqueLabel } }
        : node
    )
    const nextNodes = refactorNodeReferencesInGraph(nextNodesWithLabel, {
      oldLabel: targetNode.data.label,
      newLabel: uniqueLabel,
    })
    commitGraphState(set, { ...currentGraph, nodes: nextNodes })
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
  isSetVariableNameUnique: (nodeId, variableName) => {
    const normalizedVariableName = variableName.trim()
    if (!normalizedVariableName) {
      return false
    }
    const nodes = get().history.present.nodes
    return !nodes.some((node) => {
      if (node.id === nodeId || node.data.kind !== "setVariable") {
        return false
      }
      const candidateVariableName = node.data.config.variableName
      return (
        typeof candidateVariableName === "string" &&
        candidateVariableName.trim() === normalizedVariableName
      )
    })
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
  const uniqueLabel = createUniqueLabel(nextNode.data.label, usedLabels)
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
