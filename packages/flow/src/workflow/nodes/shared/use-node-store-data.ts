import {
  selectExpressionVariablesForNode,
  selectVisibleValidationMessagesForNode,
  useWorkflowShallowStore,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../../store"
import {
  DEFAULT_EVALUATOR_OPERATOR_OPTIONS,
  type WorkflowEvaluatorOperatorCatalog,
} from "../../types"

export function useNodeStoreData(nodeId: string) {
  const expressionVariables = useWorkflowStore((state: WorkflowStoreState) =>
    selectExpressionVariablesForNode(state, nodeId)
  )
  const evaluatorOperators = useWorkflowStore(
    (state: WorkflowStoreState): WorkflowEvaluatorOperatorCatalog =>
      state.runtime.evaluator?.operators ?? DEFAULT_EVALUATOR_OPERATOR_OPTIONS
  )
  const enableEvaluatorMultipleConditions = useWorkflowStore(
    (state: WorkflowStoreState): boolean =>
      state.runtime.enableEvaluatorMultipleConditions ?? false
  )
  const nodeValidationMessages = useWorkflowStore((state: WorkflowStoreState) =>
    selectVisibleValidationMessagesForNode(state, nodeId)
  )
  const updateNodeConfig = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeConfig
  )
  const updateNodeLabel = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeLabel
  )

  return {
    expressionVariables,
    nodeValidationMessages,
    evaluatorOperators,
    enableEvaluatorMultipleConditions,
    updateNodeConfig,
    updateNodeLabel,
  }
}
