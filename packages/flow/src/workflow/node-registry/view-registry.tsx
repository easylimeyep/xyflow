"use client"

import type { NodeProps } from "@xyflow/react"
import type { ComponentType } from "react"

import { ExtractorNode } from "../nodes/data/extractor/component"
import { InlineExpressionNode } from "../nodes/data/inline-expression/component"
import { SetVariableNode } from "../nodes/data/set-variable/component"
import { BranchNode } from "../nodes/logic/branch/component"
import { ResultNode } from "../nodes/logic/result/component"
import type { NodeKind } from "./registry"

export const nodeComponents = {
  branch: BranchNode,
  inlineExpression: InlineExpressionNode,
  setVariable: SetVariableNode,
  extractor: ExtractorNode,
  result: ResultNode,
} satisfies Partial<Record<NodeKind, ComponentType<NodeProps>>>
