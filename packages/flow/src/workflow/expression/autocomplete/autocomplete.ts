import type { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete"

import { getBuiltinExpressionCompletions } from "../builtins/builtins"
import type { ExpressionVariableOption } from "../../types/types"

const TOKEN_PATTERN = /[\w$.()[\]"']+/

export function buildExpressionCompletions(
  variables: ExpressionVariableOption[]
): Completion[] {
  const baseCompletions = [
    ...getBuiltinExpressionCompletions(),
    ...variables.map((variable) => ({
      label: variable.value,
      type: "variable" as const,
      info: variable.description,
      detail: variable.group,
    })),
  ]

  const seenLabels = new Set<string>()
  return baseCompletions.filter((completion) => {
    if (seenLabels.has(completion.label)) {
      return false
    }
    seenLabels.add(completion.label)
    return true
  })
}

export function filterExpressionCompletions(
  completions: Completion[],
  query: string
): Completion[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return completions
  }

  return completions.filter((completion) =>
    completion.label.toLowerCase().includes(normalizedQuery)
  )
}

export function createExpressionCompletionSource(
  variables: ExpressionVariableOption[]
): (context: CompletionContext) => CompletionResult | null {
  const completions = buildExpressionCompletions(variables)
  return (context) => {
    const word = context.matchBefore(TOKEN_PATTERN)
    if (!word && !context.explicit) {
      return null
    }

    const query = word?.text ?? ""
    const options = filterExpressionCompletions(completions, query).slice(0, 80)

    return {
      from: word?.from ?? context.pos,
      options,
      validFor: TOKEN_PATTERN,
    }
  }
}
