import { describe, expect, it } from "vitest"

import type { EvaluatorCondition, JsonValue } from "../../../types"
import { refactorEvaluatorConfigValue } from "./config"

/** Conditions as the config holds them: plain JSON. */
function asConfig(conditions: EvaluatorCondition[]): JsonValue {
  return conditions as unknown as JsonValue
}

function fromConfig(value: JsonValue): EvaluatorCondition[] {
  return value as unknown as EvaluatorCondition[]
}

const renameCity = (template: string) => template.replace(/\bcity\b/g, "town")

function condition(
  overrides: Partial<EvaluatorCondition> = {}
): EvaluatorCondition {
  return {
    id: "c1",
    left: { type: "value", value: "Moscow" },
    operator: "is equal to",
    right: { type: "value", value: "Paris" },
    ...overrides,
  }
}

describe("refactorEvaluatorConfigValue", () => {
  it("rewrites value operands on both sides", () => {
    const conditions = [
      condition({
        left: { type: "value", value: "{{ city }}" },
        right: { type: "value", value: "at {{ city }}" },
      }),
    ]

    expect(
      refactorEvaluatorConfigValue(
        "conditions",
        asConfig(conditions),
        renameCity
      )
    ).toEqual([
      condition({
        left: { type: "value", value: "{{ town }}" },
        right: { type: "value", value: "at {{ town }}" },
      }),
    ])
  })

  it("rewrites every array row, leaving literals as they are", () => {
    const conditions = [
      condition({
        right: {
          type: "array",
          value: ["Moscow", "{{ city }}", "prefix-{{ city }}"],
        },
      }),
    ]

    const [next] = fromConfig(
      refactorEvaluatorConfigValue(
        "conditions",
        asConfig(conditions),
        renameCity
      )
    )

    expect(next?.right).toEqual({
      type: "array",
      value: ["Moscow", "{{ town }}", "prefix-{{ town }}"],
    })
  })

  it("keeps an upstream left operand and a missing right operand", () => {
    const upstreamCondition = condition({
      left: { type: "upstream" },
      operator: "is null",
      right: undefined,
    })

    const next = fromConfig(
      refactorEvaluatorConfigValue(
        "conditions",
        asConfig([upstreamCondition]),
        renameCity
      )
    )

    expect(next[0]).toBe(upstreamCondition)
  })

  it("returns the given value when nothing references the name", () => {
    const conditions = [condition(), condition({ id: "c2" })]

    expect(
      refactorEvaluatorConfigValue(
        "conditions",
        asConfig(conditions),
        renameCity
      )
    ).toBe(conditions)
  })

  it("rewrites valid conditions next to a malformed one, which it keeps", () => {
    const malformed = { id: "legacy", left: null, operator: "is equal to" }
    const conditions = [
      malformed,
      condition({ left: { type: "value", value: "{{ city }}" } }),
    ] as unknown as JsonValue

    const next = refactorEvaluatorConfigValue(
      "conditions",
      conditions,
      renameCity
    ) as unknown as [unknown, EvaluatorCondition]

    expect(next[0]).toBe(malformed)
    expect(next[1].left).toEqual({ type: "value", value: "{{ town }}" })
  })

  it("keeps untouched conditions by identity next to a rewritten one", () => {
    const untouched = condition({ id: "c2" })
    const conditions = [
      condition({ left: { type: "value", value: "{{ city }}" } }),
      untouched,
    ]

    const next = fromConfig(
      refactorEvaluatorConfigValue(
        "conditions",
        asConfig(conditions),
        renameCity
      )
    )

    expect(next[1]).toBe(untouched)
  })

  it.each<[string, JsonValue]>([
    ["label", "{{ city }}"],
    ["conditions", "not a list"],
    ["conditions", [{ broken: true }]],
  ])("leaves key %j with value %j untouched", (key, value) => {
    expect(refactorEvaluatorConfigValue(key, value, renameCity)).toBe(value)
  })
})
