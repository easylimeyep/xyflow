import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import { getKindsFromConnection, validateConnection } from "./validation"

describe("validateConnection", () => {
  it("allows valid source/target combination", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 })
    const inline = createWorkflowNode("inlineExpression", { x: 300, y: 0 })

    const result = validateConnection(
      { source: trigger.id, target: inline.id },
      [trigger, inline],
      []
    )

    expect(result.valid).toBe(true)
  })

  it("rejects invalid combination", () => {
    const inline = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    const trigger = createWorkflowNode("trigger", { x: 300, y: 0 })

    // inlineExpression.allowedTargets does not include "trigger"
    const result = validateConnection(
      { source: inline.id, target: trigger.id },
      [inline, trigger],
      []
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toContain("cannot connect")
  })

  it("rejects duplicate edges", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 })
    const inline = createWorkflowNode("inlineExpression", { x: 300, y: 0 })
    const existingEdge = {
      id: "trigger-inline",
      source: trigger.id,
      target: inline.id,
      sourceHandle: null,
      targetHandle: null,
      data: { sourceKind: "trigger" as const, targetKind: "inlineExpression" as const },
    }

    const result = validateConnection(
      { source: trigger.id, target: inline.id },
      [trigger, inline],
      [existingEdge]
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toContain("already exists")
  })

  it("rejects cycles", () => {
    const branch = createWorkflowNode("branch", { x: 0, y: 0 })
    const inline = createWorkflowNode("inlineExpression", { x: 300, y: 0 })

    const existing = [
      {
        id: "branch-inline",
        source: branch.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: branch.data.kind,
          targetKind: inline.data.kind,
        },
      },
    ]

    const result = validateConnection(
      { source: inline.id, target: branch.id },
      [branch, inline],
      existing
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toContain("cycle")
  })

  it("resolves source and target kinds from valid connection", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 })
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 })

    const result = getKindsFromConnection(
      { source: trigger.id, target: inline.id },
      [trigger, inline]
    )

    expect(result).toEqual({
      sourceKind: "trigger",
      targetKind: "inlineExpression",
    })
  })
})
