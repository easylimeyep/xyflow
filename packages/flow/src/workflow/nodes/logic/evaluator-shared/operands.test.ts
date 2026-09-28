import { describe, expect, it } from "vitest"

import { findUnresolvedVariable, isVariableReference } from "./operands"

const VARIABLE_TYPES = { city: "value", tags: "array" }

describe("isVariableReference", () => {
  it.each([
    ["{{ city }}", true],
    ["{{city}}", true],
    ["  {{ city }}  ", true],
    ["Moscow", false],
    ["prefix-{{ id }}", false],
    ["{{ a.b }}", false],
    ["", false],
  ])("treats %j as a variable reference: %s", (value, expected) => {
    expect(isVariableReference(value)).toBe(expected)
  })
})

describe("findUnresolvedVariable", () => {
  it("returns the name of a bare reference no upstream node provides", () => {
    expect(findUnresolvedVariable("{{ missing }}", VARIABLE_TYPES)).toBe(
      "missing"
    )
  })

  it("returns nothing for a resolved reference, whatever its type", () => {
    expect(findUnresolvedVariable("{{ city }}", VARIABLE_TYPES)).toBeUndefined()
    expect(findUnresolvedVariable("{{ tags }}", VARIABLE_TYPES)).toBeUndefined()
  })

  it.each(["Moscow", "prefix-{{ missing }}", "{{ missing.field }}", ""])(
    "does not judge %j",
    (value) => {
      expect(findUnresolvedVariable(value, VARIABLE_TYPES)).toBeUndefined()
    }
  )
})
