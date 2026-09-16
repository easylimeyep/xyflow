import { describe, expect, it } from "vitest"

import { isEvaluatorCondition } from "../evaluator-shared/config"
import type { EvaluatorCondition } from "../../../types"
import { jsonEvaluator } from "./definition"

describe("jsonEvaluator definition", () => {
  it("starts every condition with an upstream left operand", () => {
    const config = jsonEvaluator.buildDefaultConfig()
    const conditions = config.conditions as unknown as EvaluatorCondition[]

    expect(conditions).toHaveLength(1)
    expect(conditions[0]?.left).toEqual({ type: "upstream" })
  })

  it("accepts a condition whose left operand is upstream", () => {
    const config = jsonEvaluator.buildDefaultConfig()

    expect(isEvaluatorCondition((config.conditions as unknown as unknown[])[0])).toBe(true)
    expect(
      jsonEvaluator.validateConfigValue?.("conditions", config.conditions)
    ).toBe(true)
  })

  it("rejects an upstream marker used as a right operand", () => {
    expect(
      isEvaluatorCondition({
        id: "c1",
        left: { type: "upstream" },
        operator: "is equal to",
        right: { type: "upstream" },
      })
    ).toBe(false)
  })
})
