import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "./node-factory"
import { normalizeNodeConfig } from "./node-config-normalization"
import { nodeRegistry } from "./registry"

describe("workflow node registry", () => {
  it("includes set variable definition", () => {
    const definition = nodeRegistry.setVariable

    expect(definition.kind).toBe("setVariable")
    expect(definition.title).toBe("Setter")
    expect(definition.buildDefaultConfig().variableName).toBe("myVar")
    expect(definition.buildDefaultConfig().valueExpression).toBeDefined()
    expect(definition.buildDefaultConfig().clear).toBe(false)
    expect(definition.renameConfigKey).toBe("variableName")
  })

  it("creates set variable node with default config", () => {
    const node = createWorkflowNode("setVariable", { x: 0, y: 0 })

    expect(node.type).toBe("setVariable")
    expect(node.data.label).toBe("Setter")
    expect(node.data.config.variableName).toBe("myVar")
    expect(node.data.config.valueExpression).toBeDefined()
    expect(node.data.config.clear).toBe(false)
  })

  it("includes inline expression definition", () => {
    const definition = nodeRegistry.inlineExpression

    expect(definition.kind).toBe("inlineExpression")
    expect(definition.title).toBe("Keyword")
    expect(
      definition.fields.find((field) => field.key === "template")?.label
    ).toBe("Tokens")
    expect(
      definition.fields.some(
        (field) => field.key === "template" && field.ui === "expression"
      )
    ).toBe(true)
    expect(
      definition.fields.find((field) => field.key === "repeatable")?.label
    ).toBe("Repeatable")
    expect(
      definition.fields.find((field) => field.key === "caseSensitive")?.label
    ).toBe("Case sensitive")
  })

  it("creates inline expression node with default config", () => {
    const node = createWorkflowNode("inlineExpression", { x: 0, y: 0 })

    expect(node.type).toBe("inlineExpression")
    expect(node.data.config.template).toEqual([])
    expect(node.data.config.isRoot).toBe(false)
    expect(node.data.config.repeatable).toBe(false)
    expect(node.data.config.caseSensitive).toBe(false)
  })

  it("normalizes missing caseSensitive values to false", () => {
    expect(
      normalizeNodeConfig("inlineExpression", {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
      }).caseSensitive
    ).toBe(false)

    expect(
      normalizeNodeConfig("evaluator", {
        conditions: [],
        logicalOperator: "and",
      }).caseSensitive
    ).toBe(false)
  })

  it("normalizes missing variable metadata defaults", () => {
    expect(
      normalizeNodeConfig("extractor", {
        tokenNumber: 1,
        extractExpression: "email",
        unlimited: false,
      }).variableType
    ).toBe("string")

    expect(
      normalizeNodeConfig("setVariable", {
        variableName: "email",
        valueExpression: "{{ email }}",
      }).clear
    ).toBe(false)

    expect(
      normalizeNodeConfig("evaluator", {
        conditions: [],
        logicalOperator: "and",
        caseSensitive: false,
      }).label
    ).toBe("conditionMatched")
  })

  it("does not expose trigger node in registry", () => {
    expect(Object.keys(nodeRegistry)).not.toContain("trigger")
  })

  it("includes extractor definition with rename config key", () => {
    const definition = nodeRegistry.extractor

    expect(definition.kind).toBe("extractor")
    expect(definition.renameConfigKey).toBe("extractExpression")
    expect(definition.buildDefaultConfig().variableType).toBe("string")
    expect(
      definition.fields.find((field) => field.key === "extractExpression")
        ?.label
    ).toBe("Label")
    expect(
      definition.fields.find((field) => field.key === "variableType")?.options
    ).toEqual([
      { label: "string", value: "string" },
      { label: "array", value: "array" },
    ])
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
