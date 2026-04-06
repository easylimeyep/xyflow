import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "./node-factory"
import { nodeRegistry } from "./registry"

describe("workflow node registry", () => {
  it("includes set variable definition", () => {
    const definition = nodeRegistry.setVariable

    expect(definition.kind).toBe("setVariable")
    expect(definition.title).toBe("Concatenate")
    expect(definition.buildDefaultConfig().variableName).toBe("myVar")
  })

  it("creates set variable node with default config", () => {
    const node = createWorkflowNode("setVariable", { x: 0, y: 0 })

    expect(node.type).toBe("setVariable")
    expect(node.data.label).toBe("Concatenate")
    expect(node.data.config.variableName).toBe("myVar")
    expect(node.data.config.valueExpression).toBe("{{ $input.item.json }}")
  })

  it("includes inline expression definition", () => {
    const definition = nodeRegistry.inlineExpression

    expect(definition.kind).toBe("inlineExpression")
    expect(definition.title).toBe("Keyword")
    expect(definition.fields.find((field) => field.key === "template")?.label).toBe("Tokens")
    expect(definition.fields.some((field) => field.key === "template" && field.ui === "expression")).toBe(
      true
    )
  })

  it("creates inline expression node with default config", () => {
    const node = createWorkflowNode("inlineExpression", { x: 0, y: 0 })

    expect(node.type).toBe("inlineExpression")
    expect(node.data.config.template).toBe("{{ $input.item.json }}")
  })

  it("includes result node definition", () => {
    const definition = nodeRegistry.result

    expect(definition.kind).toBe("result")
    expect(definition.category).toBe("logic")

    const categoryField = definition.fields.find((f) => f.key === "category")
    expect(categoryField).toBeDefined()
    expect(categoryField?.type).toBe("select")
    expect(categoryField?.label).toBe("Category")
    expect(categoryField?.options).toEqual([
      { label: "true", value: "true" },
      { label: "false", value: "false" },
    ])
  })

  it("creates result node with default config", () => {
    const node = createWorkflowNode("result", { x: 0, y: 0 })

    expect(node.type).toBe("result")
    expect(node.data.config.category).toBe("true")
  })

})
