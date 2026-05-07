import { describe, expect, it } from "vitest"

import { asStringArray } from "./node-data-utils"

describe("node data utils", () => {
  it("returns the original array reference when all entries are strings", () => {
    const value = ["{{ email }}", "lead"]

    expect(asStringArray(value)).toBe(value)
  })

  it("filters non-string entries when array normalization is needed", () => {
    const value = ["{{ email }}", 42, "lead", null]

    expect(asStringArray(value)).toEqual(["{{ email }}", "lead"])
    expect(asStringArray(value)).not.toBe(value)
  })
})
