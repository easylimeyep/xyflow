import type { NodeTypes } from "@xyflow/react"

import { BranchNode } from "./branch-node"
import { CodeNode } from "./code-node"
import { CustomInputNode } from "./custom-input-node"
import { InlineExpressionNode } from "./inline-expression-node"
import { TransformNode } from "./transform-node"
import { TriggerNode } from "./trigger-node"

export const workflowNodeTypes: NodeTypes = {
  trigger: TriggerNode,
  branch: BranchNode,
  transform: TransformNode,
  code: CodeNode,
  customInput: CustomInputNode,
  inlineExpression: InlineExpressionNode,
}
