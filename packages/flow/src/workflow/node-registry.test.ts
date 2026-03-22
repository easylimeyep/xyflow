import { describe, expect, it } from "vitest"

import { createWorkflowNode, workflowNodeRegistry } from "./node-registry"

describe("workflow node registry", () => {
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
})
