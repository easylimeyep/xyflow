import type { NodeTypes } from "@xyflow/react"

import { BranchNode } from "../branch-node/branch-node"
import { CodeNode } from "../code-node/code-node"
import { CustomInputNode } from "../custom-input-node/custom-input-node"
import { InlineExpressionNode } from "../inline-expression-node/inline-expression-node"
import { SetVariableNode } from "../set-variable-node/set-variable-node"
import { TransformNode } from "../transform-node/transform-node"
import { TriggerNode } from "../trigger-node/trigger-node"
import type { NodeKind } from "../../types/types"

const workflowNodeComponents: Record<NodeKind, NodeTypes[string]> = {
  trigger: TriggerNode,
  branch: BranchNode,
  transform: TransformNode,
  code: CodeNode,
  customInput: CustomInputNode,
  setVariable: SetVariableNode,
  inlineExpression: InlineExpressionNode,
}

export const workflowNodeTypes: NodeTypes = workflowNodeComponents
