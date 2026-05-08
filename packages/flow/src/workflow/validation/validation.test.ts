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

  it("rejects evaluator outgoing connections without a branch handle", () => {
    const evaluator = createWorkflowNode("evaluator", { x: 0, y: 0 })
    const resultNode = createWorkflowNode("result", { x: 300, y: 0 })

    const result = validateConnection(
      { source: evaluator.id, target: resultNode.id, sourceHandle: null },
      [evaluator, resultNode],
      []
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toContain("true or false output handle")
  })

  it("allows evaluator outgoing true and false branch handles", () => {
    const evaluator = createWorkflowNode("evaluator", { x: 0, y: 0 })
    const trueResult = createWorkflowNode("result", { x: 300, y: -80 })
    const falseResult = createWorkflowNode("result", { x: 300, y: 80 })

    const trueConnection = validateConnection(
      {
        source: evaluator.id,
        target: trueResult.id,
        sourceHandle: "evaluator-true",
      },
      [evaluator, trueResult, falseResult],
      []
    )
    const falseConnection = validateConnection(
      {
        source: evaluator.id,
        target: falseResult.id,
        sourceHandle: "evaluator-false",
      },
      [evaluator, trueResult, falseResult],
      []
    )

    expect(trueConnection.valid).toBe(true)
    expect(falseConnection.valid).toBe(true)
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
    const evaluator = createWorkflowNode("evaluator", { x: 0, y: 0 })
    const inline = createWorkflowNode("inlineExpression", { x: 300, y: 0 })

    const existing = [
      {
        id: "evaluator-inline",
        source: evaluator.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: evaluator.data.kind,
          targetKind: inline.data.kind,
        },
      },
    ]

    const result = validateConnection(
      { source: inline.id, target: evaluator.id },
      [evaluator, inline],
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
