import type { Completion } from "@codemirror/autocomplete"

import type { ExpressionVariableOption } from "../../types/types"

interface BuiltinExpressionVariable {
  value: string
  description: string
  completionType: Completion["type"]
}

const BUILTIN_VARIABLES: BuiltinExpressionVariable[] = [
  {
    value: "$input.item.json",
    description: "Current item payload.",
    completionType: "variable",
  },
  {
    value: "$input.first().json",
    description: "First input item payload.",
    completionType: "function",
  },
  {
    value: "$input.all()",
    description: "All input items for current node.",
    completionType: "function",
  },
]

export function getBuiltinExpressionVariables(): ExpressionVariableOption[] {
  return BUILTIN_VARIABLES.map((item) => ({
    group: "Current input",
    label: item.value,
    value: item.value,
    description: item.description,
  }))
}

export function getBuiltinExpressionCompletions(): Completion[] {
  return BUILTIN_VARIABLES.map((item) => ({
    label: item.value,
    type: item.completionType,
    info: item.description,
  }))
}
