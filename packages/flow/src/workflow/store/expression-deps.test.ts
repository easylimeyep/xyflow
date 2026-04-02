import { cloneDeep } from "es-toolkit/object"
import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowGraphState } from "../types/types"
import {
  computeStructuralSignature,
  projectExpressionDeps,
} from "./expression-deps"

function createTestGraph(): WorkflowGraphState {
  const trigger = createWorkflowNode("trigger", { x: 0, y: 80 })
  const inline = createWorkflowNode("inlineExpression", { x: 360, y: 80 })
  return {
    nodes: [trigger, inline],
    edges: [
      {
        id: `${trigger.id}-${inline.id}`,
        source: trigger.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: "trigger", targetKind: "inlineExpression" },
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    document: { id: "doc-1", name: "Flow", version: 1, metadata: {} },
  }
}

describe("expression deps projection and signature", () => {
  it("projects only expression-relevant node and edge fields", () => {
    const graph = createTestGraph()
    const deps = projectExpressionDeps(graph)
    const firstNode = deps.nodes[0]
    const firstEdge = deps.edges[0]
    if (!firstNode) {
      throw new Error("expected at least one node in projected deps")
    }
    if (!firstEdge) {
      throw new Error("expected at least one edge in projected deps")
    }

    expect(Object.keys(firstNode).sort()).toEqual(["config", "id", "kind", "label"])
    expect(Object.keys(firstEdge).sort()).toEqual([
      "id",
      "source",
      "sourceHandle",
      "target",
      "targetHandle",
    ])
  })

  it("keeps signature stable for positional changes", () => {
    const baseGraph = createTestGraph()
    const movedGraph = cloneDeep(baseGraph)
    const firstNode = movedGraph.nodes[0]
    if (!firstNode) {
      throw new Error("fixture node not found")
    }
    firstNode.position = {
      x: firstNode.position.x + 300,
      y: firstNode.position.y + 200,
    }
    firstNode.selected = !firstNode.selected

    const baseSignature = computeStructuralSignature(projectExpressionDeps(baseGraph))
    const movedSignature = computeStructuralSignature(projectExpressionDeps(movedGraph))
    expect(movedSignature).toBe(baseSignature)
  })

  it("changes signature for structural node and edge changes", () => {
    const baseGraph = createTestGraph()
    const renamedGraph = cloneDeep(baseGraph)
    const firstNode = renamedGraph.nodes[0]
    if (!firstNode) {
      throw new Error("fixture node not found")
    }
    firstNode.data = {
      ...firstNode.data,
      label: `${firstNode.data.label} changed`,
    }

    const baseSignature = computeStructuralSignature(projectExpressionDeps(baseGraph))
    const renamedSignature = computeStructuralSignature(projectExpressionDeps(renamedGraph))
    expect(renamedSignature).not.toBe(baseSignature)

    const rewiredGraph = cloneDeep(baseGraph)
    rewiredGraph.edges = []
    const rewiredSignature = computeStructuralSignature(projectExpressionDeps(rewiredGraph))
    expect(rewiredSignature).not.toBe(baseSignature)
  })

  it("is deterministic regardless of nodes/edges array order", () => {
    const baseGraph = createTestGraph()
    const reorderedGraph = cloneDeep(baseGraph)
    reorderedGraph.nodes = [...reorderedGraph.nodes].reverse()
    reorderedGraph.edges = [...reorderedGraph.edges].reverse()

    const baseSignature = computeStructuralSignature(projectExpressionDeps(baseGraph))
    const reorderedSignature = computeStructuralSignature(projectExpressionDeps(reorderedGraph))
    expect(reorderedSignature).toBe(baseSignature)
  })
})
