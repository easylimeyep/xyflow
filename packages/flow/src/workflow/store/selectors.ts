import { collectWorkflowVariables } from "../expression/variables/variables"
import type {
  ExpressionVariableOption,
  WorkflowEdge,
  WorkflowNode,
} from "../types/types"
import type { WorkflowStoreState } from "./types"

export const selectCanUndo = (state: WorkflowStoreState): boolean =>
  state.history.past.length > 0

export const selectCanRedo = (state: WorkflowStoreState): boolean =>
  state.history.future.length > 0

export const selectLastError = (state: WorkflowStoreState) =>
  state.lastError

export const selectLastErrorMessage = (state: WorkflowStoreState): string | null =>
  state.lastError?.message ?? null

export const selectPresentNodes = (state: WorkflowStoreState): WorkflowNode[] =>
  state.history.present.nodes

export const selectPresentEdges = (state: WorkflowStoreState): WorkflowEdge[] =>
  state.history.present.edges

export const selectViewport = (state: WorkflowStoreState) =>
  state.history.present.viewport

export const selectNodeCount = (state: WorkflowStoreState): number =>
  state.history.present.nodes.length

export const selectSelectedNodeIds = (state: WorkflowStoreState): string[] =>
  state.selectedNodeIds

export const selectSelectedSingleNodeId = (
  state: WorkflowStoreState
): string | null => (state.selectedNodeIds.length === 1 ? state.selectedNodeIds[0] ?? null : null)

export const selectQuickAddPending = (state: WorkflowStoreState) =>
  state.quickAddPending

export const selectEdgeInsertPending = (state: WorkflowStoreState) =>
  state.edgeInsertPending

export const selectIsEdgeInsertActive = (state: WorkflowStoreState): boolean =>
  state.edgeInsertPending !== null

export const selectSelectedNode = (
  state: WorkflowStoreState
): WorkflowNode | null => {
  const selectedNodeId = selectSelectedSingleNodeId(state)
  if (!selectedNodeId) return null
  return state.history.present.nodes.find((node) => node.id === selectedNodeId) ?? null
}


export const selectExpressionVariablesForNode = (
  state: WorkflowStoreState,
  nodeId: string | null
): ExpressionVariableOption[] => {
  const cacheKey = nodeId ?? "__global__"
  const cached = state.expressionCatalogCache.get(cacheKey)
  if (cached) {
    return cached
  }
  const nodes = state.history.present.nodes
  const edges = state.history.present.edges
  return collectWorkflowVariables(nodes, edges, nodeId)
}
