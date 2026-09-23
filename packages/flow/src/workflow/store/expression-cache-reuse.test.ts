import { describe, expect, it } from "vitest"

import {
  reuseEqualCatalog,
  reuseEqualVariableTypes,
} from "./expression-cache-reuse"
import type { ExpressionVariableOption } from "../types/types"

function option(label: string): ExpressionVariableOption {
  return {
    group: "Variables",
    label,
    value: label,
    description: `Variable from "${label}" node.`,
  }
}

describe("reuseEqualCatalog", () => {
  it("keeps the previous reference when the recomputed catalog is equal", () => {
    const previous = [option("total"), option("user")]
    const next = [option("total"), option("user")]

    expect(reuseEqualCatalog(previous, next)).toBe(previous)
  })

  it("takes the new reference when an option changed", () => {
    const previous = [option("total")]
    const next = [option("sum")]

    expect(reuseEqualCatalog(previous, next)).toBe(next)
  })

  it("takes the new reference when the length changed", () => {
    const previous = [option("total")]
    const next = [option("total"), option("user")]

    expect(reuseEqualCatalog(previous, next)).toBe(next)
  })

  it("takes the new reference when there is nothing to reuse", () => {
    const next = [option("total")]

    expect(reuseEqualCatalog(undefined, next)).toBe(next)
  })

  it("keeps the previous reference for two empty catalogs", () => {
    const previous: ExpressionVariableOption[] = []

    expect(reuseEqualCatalog(previous, [])).toBe(previous)
  })

  it("takes the new reference when only a description changed", () => {
    const previous = [option("total")]
    const next = [{ ...option("total"), description: "Variable from two." }]

    expect(reuseEqualCatalog(previous, next)).toBe(next)
  })
})

describe("reuseEqualVariableTypes", () => {
  it("keeps the previous reference when the recomputed tags are equal", () => {
    const previous = { total: "number", items: "array" }
    const next = { total: "number", items: "array" }

    expect(reuseEqualVariableTypes(previous, next)).toBe(previous)
  })

  it("takes the new reference when a tag changed", () => {
    const previous = { total: "number" }
    const next = { total: "array" }

    expect(reuseEqualVariableTypes(previous, next)).toBe(next)
  })

  it("takes the new reference when a name was added", () => {
    const previous = { total: "number" }
    const next = { total: "number", items: "array" }

    expect(reuseEqualVariableTypes(previous, next)).toBe(next)
  })

  it("takes the new reference when a name was swapped for another", () => {
    const previous = { total: "number" }
    const next = { items: "number" }

    expect(reuseEqualVariableTypes(previous, next)).toBe(next)
  })

  it("takes the new reference when there is nothing to reuse", () => {
    const next = { total: "number" }

    expect(reuseEqualVariableTypes(undefined, next)).toBe(next)
  })
})
