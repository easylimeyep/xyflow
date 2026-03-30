import { describe, expect, it } from "vitest"

import { normalizeNodeConfig } from "./node-config-normalization"
import { createWorkflowNode } from "./node-factory"
import { workflowNodeRegistry } from "./node-ui-metadata"

describe("workflow node registry", () => {
  it("includes set variable definition", () => {
    const definition = workflowNodeRegistry.setVariable

    expect(definition.kind).toBe("setVariable")
    expect(definition.buildDefaultConfig().variableName).toBe("myVar")
  })

  it("creates set variable node with default config", () => {
    const node = createWorkflowNode("setVariable", { x: 0, y: 0 })

    expect(node.type).toBe("setVariable")
    expect(node.data.config.variableName).toBe("myVar")
    expect(node.data.config.valueExpression).toBe("{{ $input.item.json }}")
  })

  it("includes inline expression definition", () => {
    const definition = workflowNodeRegistry.inlineExpression

    expect(definition.kind).toBe("inlineExpression")
    expect(definition.fields.some((field) => field.key === "template" && field.ui === "expression")).toBe(
      true
    )
  })

  it("creates inline expression node with default config", () => {
    const node = createWorkflowNode("inlineExpression", { x: 0, y: 0 })

    expect(node.type).toBe("inlineExpression")
    expect(node.data.config.template).toBe("{{ $input.item.json }}")
  })

  it("falls back to default select option for invalid values", () => {
    const nextConfig = normalizeNodeConfig("customInput", {
      inputKind: "unknown-value" as "config",
    })

    expect(nextConfig.inputKind).toBe("config")
  })
})
