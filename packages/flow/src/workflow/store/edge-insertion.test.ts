import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowGraphState } from "../types/types"
import { computeEdgeInsertion } from "./edge-insertion"

function createGraph(
  source = createWorkflowNode("trigger", { x: 0, y: 0 }),
  target = createWorkflowNode("inlineExpression", { x: 320, y: 0 })
): WorkflowGraphState {
  return {
    nodes: [source, target],
    edges: [
      {
        id: "edge-main",
        source: source.id,
        target: target.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: source.data.kind,
          targetKind: target.data.kind,
        },
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    document: {
      id: "doc-1",
      name: "Flow",
      version: 1,
      metadata: {},
    },
  }
}

describe("computeEdgeInsertion", () => {
  it("returns failure when target edge is missing", () => {
    const graph = createGraph()
    const result = computeEdgeInsertion(graph, "missing-edge", "extractor")

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("Failed to resolve edge")
    }
  })

  it("splits edge into two valid edges when both legs are valid", () => {
    const graph = createGraph()
    const result = computeEdgeInsertion(graph, "edge-main", "extractor")

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.nextEdges).toHaveLength(2)
      expect(result.nextEdges.some((edge) => edge.target === result.insertedNodeId)).toBe(true)
      expect(result.nextEdges.some((edge) => edge.source === result.insertedNodeId)).toBe(true)
    }
  })

  it("falls back to inserted->target edge when source leg is invalid", () => {
    const source = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    const target = createWorkflowNode("setVariable", { x: 320, y: 0 })
    const graph = createGraph(source, target)
    const result = computeEdgeInsertion(graph, "edge-main", "trigger")

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.nextEdges).toHaveLength(1)
      expect(result.nextEdges[0]?.source).toBe(result.insertedNodeId)
      expect(result.nextEdges[0]?.target).toBe(target.id)
    }
  })
})
