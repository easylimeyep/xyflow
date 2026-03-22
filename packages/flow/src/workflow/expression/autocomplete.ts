import type { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete"

import type { ExpressionVariableOption } from "../types"

const TOKEN_PATTERN = /[\w$.()[\]"']*/

const BUILTIN_COMPLETIONS: Completion[] = [
  {
    label: "$input.item.json",
    type: "variable",
    info: "Current input item payload.",
  },
  {
    label: "$input.first().json",
    type: "function",
    info: "First input item payload.",
  },
  {
    label: "$input.all()",
    type: "function",
    info: "All input items for current node.",
  },
]

export function buildExpressionCompletions(
  variables: ExpressionVariableOption[]
): Completion[] {
  return [
    ...BUILTIN_COMPLETIONS,
    ...variables.map((variable) => ({
      label: variable.value,
      type: "variable" as const,
      info: variable.description,
      detail: variable.group,
    })),
  ]
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
