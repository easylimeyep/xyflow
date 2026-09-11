import type { EvaluatorMatchType, FieldOption } from "../../../types"

export const DEFAULT_MATCH_TYPE: EvaluatorMatchType = "any"

/**
 * The match types the node ships with, in display order. A host may replace
 * them through `runtime.nodeOptions.jsonEvaluator.matchType`, which is why the
 * component reads the active list from the store instead of this constant and
 * only falls back here.
 */
export const MATCH_TYPE_OPTIONS = [
  { value: "any", label: "Any match" },
  { value: "all", label: "All match" },
  { value: "one", label: "Only one match" },
] satisfies FieldOption[]
