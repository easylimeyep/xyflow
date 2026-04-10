import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import { getKindsFromConnection, validateConnection } from "./validation"

describe("validateConnection", () => {
  it("allows valid source/target combination", () => {
    const rootKeyword = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    rootKeyword.data.config.isRoot = true
    const inline = createWorkflowNode("inlineExpression", { x: 300, y: 0 })

    const result = validateConnection(
      { source: rootKeyword.id, target: inline.id },
      [rootKeyword, inline],
      []
    )

    expect(result.valid).toBe(true)
  })

  it("rejects invalid combination", () => {
    const inline = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    const rootKeyword = createWorkflowNode("inlineExpression", { x: 300, y: 0 })
    rootKeyword.data.config.isRoot = true

    const result = validateConnection(
      { source: inline.id, target: rootKeyword.id },
      [inline, rootKeyword],
      []
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toContain("Root Keyword")
  })

  it("rejects duplicate edges", () => {
    const rootKeyword = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    rootKeyword.data.config.isRoot = true
    const inline = createWorkflowNode("inlineExpression", { x: 300, y: 0 })
    const existingEdge = {
      id: "keyword-inline",
      source: rootKeyword.id,
      target: inline.id,
      sourceHandle: null,
      targetHandle: null,
      data: {
        sourceKind: "inlineExpression" as const,
        targetKind: "inlineExpression" as const,
      },
    }

    const result = validateConnection(
      { source: rootKeyword.id, target: inline.id },
      [rootKeyword, inline],
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
    const rootKeyword = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    rootKeyword.data.config.isRoot = true
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 })

    const result = getKindsFromConnection(
      { source: rootKeyword.id, target: inline.id },
      [rootKeyword, inline]
    )

    expect(result).toEqual({
      sourceKind: "inlineExpression",
      targetKind: "inlineExpression",
    })
  })
})
