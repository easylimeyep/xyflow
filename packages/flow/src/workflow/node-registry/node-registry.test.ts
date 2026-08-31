import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "./builtin-base-definitions"
import { createWorkflowNode } from "./node-factory"
import {
  decodeNodeConfig,
  normalizeNodeConfig,
} from "./node-config-normalization"
import { getNodeDefinition, workflowNodeKinds } from "./registry"
import { evaluator } from "../nodes/logic/evaluator/definition"
import { result } from "../nodes/logic/result/definition"
import { createNodeRegistry, EMPTY_NODE_REGISTRY } from "./registry"

const registry = createNodeRegistry(builtinBaseDefinitions)

describe("workflow node registry", () => {
  it("includes set variable definition", () => {
    const definition = getNodeDefinition("setVariable")!

    expect(definition.kind).toBe("setVariable")
    expect(definition.title).toBe("Setter")
    expect(definition.buildDefaultConfig().variableName).toBe("")
    expect(definition.buildDefaultConfig().variableType).toBe("value")
    expect(definition.buildDefaultConfig().valueExpression).toBeDefined()
    expect(definition.buildDefaultConfig().clear).toBe(false)
    expect(definition.renameConfigKey).toBe("variableName")
    expect(
      definition.fields.find((field) => field.key === "variableType")?.options
    ).toEqual([
      { label: "value", value: "value" },
      { label: "array", value: "array" },
    ])
  })

  it("creates set variable node with default config", () => {
    const node = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })

    expect(node.type).toBe("setVariable")
    expect(node.data.label).toBe("Setter")
    expect(node.data.config.variableName).toBe("")
    expect(node.data.config.variableType).toBe("value")
    expect(node.data.config.valueExpression).toBeDefined()
    expect(node.data.config.clear).toBe(false)
  })

  it("includes inline expression definition", () => {
    const definition = getNodeDefinition("inlineExpression")!

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
    const node = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })

    expect(node.type).toBe("inlineExpression")
    expect(node.data.config.template).toEqual([])
    expect(node.data.config.isRoot).toBe(false)
    expect(node.data.config.repeatable).toBe(false)
    expect(node.data.config.caseSensitive).toBe(false)
  })

  it("normalizes missing caseSensitive values to false", () => {
    expect(
      normalizeNodeConfig(registry, "inlineExpression", {
        template: ["lead"],
        isRoot: true,
        repeatable: false,
      }).caseSensitive
    ).toBe(false)

    expect(
      normalizeNodeConfig(registry, "evaluator", {
        conditions: [],
        logicalOperator: "and",
      }).caseSensitive
    ).toBe(false)
  })

  it("normalizes missing variable metadata defaults", () => {
    expect(
      normalizeNodeConfig(registry, "extractor", {
        tokenNumber: 1,
        extractExpression: "email",
        unlimited: false,
      }).variableType
    ).toBe("value")

    expect(
      normalizeNodeConfig(registry, "setVariable", {
        variableName: "email",
        valueExpression: "{{ email }}",
      }).clear
    ).toBe(false)
    expect(
      normalizeNodeConfig(registry, "setVariable", {
        variableName: "email",
        valueExpression: "{{ email }}",
      }).variableType
    ).toBe("value")

    expect(
      normalizeNodeConfig(registry, "evaluator", {
        conditions: [],
        logicalOperator: "and",
        caseSensitive: false,
      }).label
    ).toBe("")
  })

  it("keeps evaluator result label separate from variable type metadata", () => {
    const evaluatorConfig = normalizeNodeConfig(registry, "evaluator", {
      label: "",
      conditions: [],
      logicalOperator: "and",
      caseSensitive: false,
    })

    expect(evaluatorConfig.label).toBe("")
    expect(evaluatorConfig).not.toHaveProperty("labelType")
    expect(evaluatorConfig).not.toHaveProperty("variableType")

    expect(
      normalizeNodeConfig(registry, "setVariable", {
        variableName: "email",
        variableType: "array",
        valueExpression: "{{ email }}",
        clear: false,
      })
    ).toMatchObject({
      variableName: "email",
      variableType: "array",
    })
    expect(
      normalizeNodeConfig(registry, "extractor", {
        tokenNumber: 1,
        extractExpression: "email",
        variableType: "array",
        unlimited: false,
      })
    ).toMatchObject({
      extractExpression: "email",
      variableType: "array",
    })
  })

  it("rejects string workflow type literals", () => {
    expect(
      decodeNodeConfig(registry, "extractor", {
        tokenNumber: 1,
        extractExpression: "email",
        variableType: "string",
        unlimited: false,
      }).success
    ).toBe(false)

    expect(
      decodeNodeConfig(registry, "setVariable", {
        variableName: "email",
        variableType: "string",
        valueExpression: "{{ email }}",
        clear: false,
      }).success
    ).toBe(false)

    expect(
      decodeNodeConfig(registry, "evaluator", {
        conditions: [
          {
            id: "condition-1",
            left: { type: "string", value: "{{ source }}" },
            operator: "is equal to",
            right: { type: "string", value: "{{ target }}" },
          },
        ],
        logicalOperator: "and",
        caseSensitive: false,
      }).success
    ).toBe(false)
  })

  it("does not expose trigger node in registry", () => {
    expect(workflowNodeKinds()).not.toContain("trigger")
  })

  it("includes extractor definition with rename config key", () => {
    const definition = getNodeDefinition("extractor")!

    expect(definition.kind).toBe("extractor")
    expect(definition.renameConfigKey).toBe("extractExpression")
    expect(definition.buildDefaultConfig().tokenNumber).toBe(1)
    expect(definition.buildDefaultConfig().variableType).toBe("value")
    expect(
      definition.fields.find((field) => field.key === "extractExpression")
        ?.label
    ).toBe("Label")
    expect(
      definition.fields.find((field) => field.key === "variableType")?.options
    ).toEqual([
      { label: "value", value: "value" },
      { label: "array", value: "array" },
    ])
  })

  it("includes result node definition", () => {
    const definition = getNodeDefinition("result")!

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
    const node = createWorkflowNode(registry, "result", { x: 0, y: 0 })

    expect(node.type).toBe("result")
    expect(node.data.config.category).toBe("true")
  })
})

describe("createWorkflowNode over a given registry", () => {
  it("builds from the registry it is given, not a global", () => {
    const localRegistry = createNodeRegistry([evaluator])
    const node = createWorkflowNode(localRegistry, "evaluator", { x: 0, y: 0 })

    expect(node.data.kind).toBe("evaluator")
    expect(node.data.label).toBe(evaluator.title)
  })

  it("throws for a kind absent from the given registry", () => {
    expect(() =>
      createWorkflowNode(createNodeRegistry([]), "evaluator", { x: 0, y: 0 })
    ).toThrow("Unknown node kind: evaluator")
  })
})

describe("createNodeRegistry", () => {
  it("indexes definitions by kind and preserves declaration order", () => {
    const registry = createNodeRegistry([evaluator, result])
    expect(registry.kinds()).toEqual(["evaluator", "result"])
    expect(registry.get("evaluator")).toBe(evaluator)
    expect(registry.has("result")).toBe(true)
  })

  it("returns undefined for an unregistered kind rather than throwing", () => {
    expect(createNodeRegistry([]).get("nope")).toBeUndefined()
    expect(createNodeRegistry([]).has("nope")).toBe(false)
  })

  it("lets a later definition of the same kind replace an earlier one in place", () => {
    const shadowed = { ...evaluator, title: "Shadowed" }
    const registry = createNodeRegistry([evaluator, result, shadowed])
    expect(registry.kinds()).toEqual(["evaluator", "result"])
    expect(registry.get("evaluator")?.title).toBe("Shadowed")
  })

  it("drops a definition with an empty kind", () => {
    const nameless = { ...evaluator, kind: "" }
    expect(createNodeRegistry([nameless]).kinds()).toEqual([])
  })

  it("EMPTY_NODE_REGISTRY lists nothing", () => {
    expect(EMPTY_NODE_REGISTRY.list()).toEqual([])
  })
})
