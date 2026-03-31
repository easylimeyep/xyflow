import {
  selectExpressionVariablesForNode,
  useWorkflowShallowStore,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../../store"

export function useNodeStoreData(nodeId: string) {
  const expressionVariables = useWorkflowStore((state: WorkflowStoreState) =>
    selectExpressionVariablesForNode(state, nodeId)
  )
  const updateNodeConfig = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeConfig
  )
  const isSetVariableNameUnique = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.isSetVariableNameUnique
  )

  return { expressionVariables, updateNodeConfig, isSetVariableNameUnique }
}
