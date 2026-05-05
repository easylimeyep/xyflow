import {
  selectExpressionVariablesForNode,
  useWorkflowShallowStore,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../../store"
import type { WorkflowEvaluatorOperatorOption } from "../../types"

export function useNodeStoreData(nodeId: string) {
  const expressionVariables = useWorkflowStore((state: WorkflowStoreState) =>
    selectExpressionVariablesForNode(state, nodeId)
  )
  const evaluatorOperators = useWorkflowStore(
    (state: WorkflowStoreState): WorkflowEvaluatorOperatorOption[] =>
      state.runtime.evaluator?.operators ?? []
  )
  const enableEvaluatorMultipleConditions = useWorkflowStore(
    (state: WorkflowStoreState): boolean =>
      state.runtime.enableEvaluatorMultipleConditions ?? false
  )
  const updateNodeConfig = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeConfig
  )
  const updateNodeLabel = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeLabel
  )

  return {
    expressionVariables,
    evaluatorOperators,
    enableEvaluatorMultipleConditions,
    updateNodeConfig,
    updateNodeLabel,
  }
}
