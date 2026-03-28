import { describe, expect, it } from "vitest"

import { initialWorkflowGraph } from "../default-graph/default-graph"
import { createWorkflowNode } from "../node-registry/node-registry"
import { getKindsFromConnection, validateConnection } from "./validation"

describe("validateConnection", () => {
  it("allows valid source/target combination", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 })
    const transform = createWorkflowNode("transform", { x: 300, y: 0 })

    const result = validateConnection(
      { source: trigger.id, target: transform.id },
      [trigger, transform],
      []
    )

    expect(result.valid).toBe(true)
  })

  it("rejects invalid combination", () => {
    const code = createWorkflowNode("code", { x: 0, y: 0 })
    const trigger = createWorkflowNode("trigger", { x: 300, y: 0 })

    const result = validateConnection(
      { source: code.id, target: trigger.id },
      [code, trigger],
      []
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toContain("cannot connect")
  })

  it("rejects duplicate edges", () => {
    const [sourceNode, targetNode] = initialWorkflowGraph.nodes
    const edge = initialWorkflowGraph.edges[0]
    if (!sourceNode || !targetNode || !edge) {
      throw new Error("default graph fixture is invalid")
    }

    const result = validateConnection(
      {
        source: sourceNode.id,
        target: targetNode.id,
      },
      initialWorkflowGraph.nodes,
      initialWorkflowGraph.edges
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toContain("already exists")
  })

  it("rejects cycles", () => {
    const branch = createWorkflowNode("branch", { x: 0, y: 0 })
    const transform = createWorkflowNode("transform", { x: 300, y: 0 })

    const existing = [
      {
        id: "branch-transform",
        source: branch.id,
        target: transform.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: branch.data.kind,
          targetKind: transform.data.kind,
        },
      },
    ]

    const result = validateConnection(
      { source: transform.id, target: branch.id },
      [branch, transform],
      existing
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toContain("cycle")
  })

  it("resolves source and target kinds from valid connection", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 })
    const transform = createWorkflowNode("transform", { x: 200, y: 0 })

    const result = getKindsFromConnection(
      { source: trigger.id, target: transform.id },
      [trigger, transform]
    )

    expect(result).toEqual({
      sourceKind: "trigger",
      targetKind: "transform",
    })
  })
})
