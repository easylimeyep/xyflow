/**
 * Branching node vocabulary.
 *
 * A branching node splits the flow in two: every outgoing connection leaves
 * through the `true` or the `false` handle instead of a single anonymous one.
 * Both built-in evaluators branch, and everything that reasons about branches —
 * connection validation, layout, backend export, quick-add geometry — asks
 * here rather than testing a kind literal.
 */
export const EVALUATOR_TRUE_HANDLE = "evaluator-true"
export const EVALUATOR_FALSE_HANDLE = "evaluator-false"

const BRANCHING_NODE_KINDS = new Set<string>(["evaluator", "jsonEvaluator"])

export function isBranchingKind(kind: string | undefined): boolean {
  return kind !== undefined && BRANCHING_NODE_KINDS.has(kind)
}

export type BranchHandleId =
  | typeof EVALUATOR_TRUE_HANDLE
  | typeof EVALUATOR_FALSE_HANDLE

export function isBranchHandle(
  handleId: string | null | undefined
): handleId is BranchHandleId {
  return (
    handleId === EVALUATOR_TRUE_HANDLE || handleId === EVALUATOR_FALSE_HANDLE
  )
}
