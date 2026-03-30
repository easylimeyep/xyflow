"use client"

import type { NodeProps, NodeTypes } from "@xyflow/react"

import {
  selectExpressionVariablesForNode,
  selectPresentNodes,
  useWorkflowShallowStore,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../../store"
import type { NodeKind } from "../../types/types"
import { BranchNode } from "../branch-node/branch-node"
import { CodeNode } from "../code-node/code-node"
import { CustomInputNode } from "../custom-input-node/custom-input-node"
import { InlineExpressionNode } from "../inline-expression-node/inline-expression-node"
import { SetVariableNode } from "../set-variable-node/set-variable-node"
import { TransformNode } from "../transform-node/transform-node"
import { TriggerNode } from "../trigger-node/trigger-node"

function InlineExpressionNodeContainer(props: NodeProps) {
  const expressionVariables = useWorkflowStore((state: WorkflowStoreState) =>
    selectExpressionVariablesForNode(state, props.id)
  )
  const onUpdateConfigField = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeConfigField
  )

  return (
    <InlineExpressionNode
      {...props}
      expressionVariables={expressionVariables}
      onUpdateConfigField={onUpdateConfigField}
    />
  )
}

function SetVariableNodeContainer(props: NodeProps) {
  const expressionVariables = useWorkflowStore((state: WorkflowStoreState) =>
    selectExpressionVariablesForNode(state, props.id)
  )
  const onUpdateConfigField = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeConfigField
  )
  const allNodes = useWorkflowStore(selectPresentNodes)

  return (
    <SetVariableNode
      {...props}
      expressionVariables={expressionVariables}
      onUpdateConfigField={onUpdateConfigField}
      allNodes={allNodes}
    />
  )
}

const workflowNodeComponents: Record<NodeKind, NodeTypes[string]> = {
  trigger: TriggerNode,
  branch: BranchNode,
  transform: TransformNode,
  code: CodeNode,
  customInput: CustomInputNode,
  setVariable: SetVariableNodeContainer,
  inlineExpression: InlineExpressionNodeContainer,
}

export const workflowNodeTypes: NodeTypes = workflowNodeComponents
