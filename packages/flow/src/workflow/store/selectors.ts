import type {
  ExpressionVariableOption,
  NormalizedWorkflowNodeValidationMessage,
  NormalizedWorkflowValidationMessage,
  WorkflowEdge,
  WorkflowNode,
  WorkflowVariableType,
} from "../types/types"
import type { WorkflowStoreState } from "./types"
import { isValidationMessageVisible } from "./validation"
import { collectWorkflowVariableTypes } from "../expression/variables/variables"

export const selectCanUndo = (state: WorkflowStoreState): boolean =>
  state.history.past.length > 0

export const selectCanRedo = (state: WorkflowStoreState): boolean =>
  state.history.future.length > 0

export const selectLastError = (state: WorkflowStoreState) =>
  state.lastError

export const selectLastErrorMessage = (state: WorkflowStoreState): string | null =>
  state.lastError?.message ?? null

export const selectVisibleGlobalValidationMessages = (
  state: WorkflowStoreState
): NormalizedWorkflowValidationMessage[] =>
  state.validation.server?.global.filter((message) =>
    isValidationMessageVisible(state, message)
  ) ?? []

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

export const selectVisibleValidationMessagesForNode = (
  state: WorkflowStoreState,
  nodeId: string
): NormalizedWorkflowNodeValidationMessage[] =>
  state.validation.server?.nodesById[nodeId]?.filter((message) =>
    isValidationMessageVisible(state, message)
  ) ?? []

export const selectNodeHasVisibleValidation = (
  state: WorkflowStoreState,
  nodeId: string
): boolean => selectVisibleValidationMessagesForNode(state, nodeId).length > 0


export const selectExpressionVariablesForNode = (
  state: WorkflowStoreState,
  nodeId: string | null
): ExpressionVariableOption[] => {
  const cacheKey = nodeId ?? "__global__"
  const cached = state.expressionCatalogCache.get(cacheKey)
  if (cached) {
    return cached
  }
  return []
}

export const selectExpressionVariableTypesForNode = (
  state: WorkflowStoreState,
  nodeId: string | null
): Record<string, WorkflowVariableType> => {
  if (!nodeId) {
    return {}
  }

  return collectWorkflowVariableTypes(
    state.history.present.nodes,
    state.history.present.edges,
    nodeId
  )
}
