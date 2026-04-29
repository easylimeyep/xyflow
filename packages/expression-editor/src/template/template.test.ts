import { describe, expect, it } from "vitest"

import {
  buildExpressionInsertion,
  parseTemplateSegments,
  validateTemplateExpression,
} from "./template"

describe("template expression parser", () => {
  it("splits literal and expression segments", () => {
    const segments = parseTemplateSegments("before {{ myVar }} after")
    expect(segments).toHaveLength(3)
    expect(segments[0]?.type).toBe("literal")
    expect(segments[1]?.type).toBe("expression")
  })

  it("reports syntax errors for invalid expressions", () => {
    const result = validateTemplateExpression('test {{ $("Node").item.json. }}')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("reports missing closing braces", () => {
    const result = validateTemplateExpression("{{ myVar")
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toContain("Missing closing braces")
  })

  it("builds wrapped insertion value", () => {
    expect(buildExpressionInsertion("myVar")).toBe("{{ myVar }}")
  })

  it("rejects $input references as invalid", () => {
    const result = validateTemplateExpression("{{ $input.item.json }}")
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toContain("$input")
  })

  it("rejects $node references as invalid", () => {
    const result = validateTemplateExpression('{{ $node("Label").item.json }}')
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toContain("$node")
  })

  it("accepts plain identifier as valid", () => {
    const result = validateTemplateExpression("{{ myVar }}")
    expect(result.valid).toBe(true)
  })
})
