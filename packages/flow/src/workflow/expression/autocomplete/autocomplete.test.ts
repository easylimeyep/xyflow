import { describe, expect, it } from "vitest"

import type { ExpressionVariableOption } from "../../types/types"
import {
  buildExpressionCompletions,
  filterExpressionCompletions,
} from "./autocomplete"

const VARIABLES: ExpressionVariableOption[] = [
  {
    value: '$("TriggerA").item.json.eventName',
    label: '$("TriggerA").item.json.eventName',
    description: "Trigger event",
    group: "Upstream: TriggerA",
  },
  {
    value: '$("TransformA").item.json.result',
    label: '$("TransformA").item.json.result',
    description: "Transform result",
    group: "Upstream: TransformA",
  },
]

describe("expression autocomplete helpers", () => {
  it("builds completions from builtins and variables", () => {
    const completions = buildExpressionCompletions(VARIABLES)
    expect(completions.some((entry) => entry.label === "$input.item.json")).toBe(true)
    expect(
      completions.some((entry) => entry.label === '$("TriggerA").item.json.eventName')
    ).toBe(true)
  })

  it("filters completions by query, case-insensitive", () => {
    const completions = buildExpressionCompletions(VARIABLES)
    const filtered = filterExpressionCompletions(completions, "transforma")
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.label).toContain("TransformA")
  })

  it("deduplicates completion labels when builtins are also present in variables", () => {
    const completions = buildExpressionCompletions([
      ...VARIABLES,
      {
        value: "$input.all()",
        label: "$input.all()",
        description: "Duplicate builtin",
        group: "Current input",
      },
    ])

    const inputAllCount = completions.filter((entry) => entry.label === "$input.all()").length
    expect(inputAllCount).toBe(1)
  })
})
