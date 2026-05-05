import type { NodeDefinition } from "./define-node"
import { extractor } from "../nodes/data/extractor"
import { inlineExpression } from "../nodes/data/inline-expression"
import { setVariable } from "../nodes/data/set-variable"
import { evaluator } from "../nodes/logic/evaluator"
import { result } from "../nodes/logic/result"

const allDefinitions = [
  evaluator,
  setVariable,
  inlineExpression,
  extractor,
  result,
] as const

type AllDefinitions = typeof allDefinitions
type ExtractKind<T> = T extends NodeDefinition<infer K> ? K : never

export type NodeKind = ExtractKind<AllDefinitions[number]>

export const WORKFLOW_NODE_KINDS = allDefinitions.map(
  (d) => d.kind
) as NodeKind[]

export function isNodeKind(value: unknown): value is NodeKind {
  return (
    typeof value === "string" &&
    (WORKFLOW_NODE_KINDS as string[]).includes(value)
  )
}

export const nodeRegistry = Object.fromEntries(
  allDefinitions.map((d) => [d.kind, d])
) as { [K in NodeKind]: NodeDefinition<K> }

export function getNodeDefinition(kind: NodeKind): NodeDefinition {
  return nodeRegistry[kind]
}

export { allDefinitions }
