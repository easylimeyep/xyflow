import {
  selectExpressionVariablesForNode,
  useWorkflowShallowStore,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../../store"
import type { WorkflowBranchOperatorOption } from "../../types"

export function useNodeStoreData(nodeId: string) {
  const expressionVariables = useWorkflowStore((state: WorkflowStoreState) =>
    selectExpressionVariablesForNode(state, nodeId)
  )
  const branchOperators = useWorkflowStore(
    (state: WorkflowStoreState): WorkflowBranchOperatorOption[] =>
      state.runtime.branch?.operators ?? []
  )
  const updateNodeConfig = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeConfig
  )
  const updateNodeLabel = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeLabel
  )

  return {
    expressionVariables,
    branchOperators,
    updateNodeConfig,
    updateNodeLabel,
  }
}
