import {
  selectExpressionVariablesForNode,
  selectPresentNodes,
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
  const allNodes = useWorkflowStore(selectPresentNodes)

  return { expressionVariables, updateNodeConfig, allNodes }
}
