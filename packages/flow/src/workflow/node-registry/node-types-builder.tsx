"use client"

import type { NodeProps, NodeTypes } from "@xyflow/react"
import type { ComponentType } from "react"

import { InlineExpressionNode } from "../nodes/data/inline-expression/inline-expression-node"
import { ExtractorNode } from "../nodes/data/extractor/extractor-node"
import { SetVariableNode } from "../nodes/data/set-variable/set-variable-node"
import { BranchNode } from "../nodes/logic/branch-node"
import { DefaultNodeRenderer } from "../nodes/shared/default-node-renderer"
import type { NodeDefinition } from "./define-node"

const componentOverrides: Record<string, ComponentType<NodeProps>> = {
  branch: BranchNode,
  inlineExpression: InlineExpressionNode,
  setVariable: SetVariableNode,
  extractor: ExtractorNode,
}

export function buildNodeTypes(
  definitions: readonly NodeDefinition[]
): NodeTypes {
  return Object.fromEntries(
    definitions.map((definition) => [
      definition.kind,
      componentOverrides[definition.kind] ??
        function GeneratedNode(props: NodeProps) {
          return <DefaultNodeRenderer {...props} definition={definition} />
        },
    ])
  )
}
