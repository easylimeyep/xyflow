import type { EvaluatorMatchType } from "../../../types"

export const DEFAULT_MATCH_TYPE: EvaluatorMatchType = "any"

export const MATCH_TYPE_OPTIONS: {
  id: EvaluatorMatchType
  label: string
}[] = [
  { id: "any", label: "Any match" },
  { id: "all", label: "All match" },
  { id: "one", label: "Only one match" },
]

export function isEvaluatorMatchType(
  value: unknown
): value is EvaluatorMatchType {
  return MATCH_TYPE_OPTIONS.some((option) => option.id === value)
}
