import { InlineExpressionNode } from "../nodes/data/inline-expression/inline-expression-node"
import { ExtractorNode } from "../nodes/data/extractor/extractor-node"
import { SetVariableNode } from "../nodes/data/set-variable/set-variable-node"
import { BranchNode } from "../nodes/logic/branch-node"
import { ResultNode } from "../nodes/logic/result-node"
import { nodeRegistry } from "./registry"

nodeRegistry.branch.component = BranchNode
nodeRegistry.inlineExpression.component = InlineExpressionNode
nodeRegistry.setVariable.component = SetVariableNode
nodeRegistry.extractor.component = ExtractorNode
nodeRegistry.result.component = ResultNode
