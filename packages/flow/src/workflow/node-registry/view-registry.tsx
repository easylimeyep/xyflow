"use client"

import type { NodeProps } from "@xyflow/react"
import type { ComponentType } from "react"

import { ExtractorNode } from "../nodes/data/extractor/component"
import { InlineExpressionNode } from "../nodes/data/inline-expression/component"
import { SetVariableNode } from "../nodes/data/set-variable/component"
import { EvaluatorNode } from "../nodes/logic/evaluator/component"
import { ResultNode } from "../nodes/logic/result/component"
import { notifyNodeRegistryChanged } from "./registry"

export type NodeViewMap = Readonly<Record<string, ComponentType<NodeProps>>>

/** Bespoke renderers shipped with the package, keyed by node kind. */
const builtinNodeViews: NodeViewMap = {
  evaluator: EvaluatorNode,
  inlineExpression: InlineExpressionNode,
  setVariable: SetVariableNode,
  extractor: ExtractorNode,
  result: ResultNode,
}

let views: NodeViewMap = builtinNodeViews

/**
 * Give a registered kind a bespoke renderer.
 *
 * Optional: a definition with no view renders through `DefaultNodeRenderer`,
 * which draws any node from its `fields`. Registering a view is how a consumer
 * opts one kind out of that generic treatment. Registering the same kind twice
 * replaces the previous component, so a hot reload does not accumulate.
 */
export function registerNodeViews(incoming: NodeViewMap): void {
  if (Object.keys(incoming).length === 0) {
    return
  }
  views = { ...views, ...incoming }
  notifyNodeRegistryChanged()
}

/** Drop consumer views and return to the package's own. For tests. */
export function resetNodeViews(): void {
  views = builtinNodeViews
  notifyNodeRegistryChanged()
}

/** The live view map. */
export function listNodeViews(): NodeViewMap {
  return views
}

export { builtinNodeViews }
