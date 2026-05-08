import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowGraphState } from "../types/types"
import { computeEdgeInsertion } from "./edge-insertion"

function createGraph(
  source = createWorkflowNode("inlineExpression", { x: 0, y: 0 }),
  target = createWorkflowNode("inlineExpression", { x: 320, y: 0 })
): WorkflowGraphState {
  source.data.config.isRoot = true
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
      expect(
        result.nextEdges.some((edge) => edge.target === result.insertedNodeId)
      ).toBe(true)
      expect(
        result.nextEdges.some((edge) => edge.source === result.insertedNodeId)
      ).toBe(true)
    }
  })

  it("falls back to inserted->target edge when source leg is invalid", () => {
    const source = createWorkflowNode("result", { x: 0, y: 0 })
    const target = createWorkflowNode("setVariable", { x: 320, y: 0 })
    const graph = createGraph(source, target)
    const result = computeEdgeInsertion(graph, "edge-main", "evaluator")

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.nextEdges).toHaveLength(1)
      expect(result.nextEdges[0]?.source).toBe(result.insertedNodeId)
      expect(result.nextEdges[0]?.target).toBe(target.id)
      expect(result.nextEdges[0]?.sourceHandle).toBe("evaluator-true")
    }
  })

  it("continues inserted evaluator edges through the true branch", () => {
    const source = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    const target = createWorkflowNode("result", { x: 320, y: 0 })
    const graph = createGraph(source, target)

    const result = computeEdgeInsertion(graph, "edge-main", "evaluator")

    expect(result.ok).toBe(true)
    if (result.ok) {
      const continuation = result.nextEdges.find(
        (edge) =>
          edge.source === result.insertedNodeId && edge.target === target.id
      )

      expect(continuation?.sourceHandle).toBe("evaluator-true")
      expect(
        result.nextEdges.some(
          (edge) =>
            edge.source === result.insertedNodeId && edge.sourceHandle === null
        )
      ).toBe(false)
      expect(
        result.nextEdges.some(
          (edge) =>
            edge.source === result.insertedNodeId &&
            edge.sourceHandle === "evaluator-false"
        )
      ).toBe(false)
    }
  })

  it("preserves upstream source handle when inserting evaluator on a handled edge", () => {
    const source = createWorkflowNode("evaluator", { x: 0, y: 0 })
    const target = createWorkflowNode("result", { x: 320, y: 0 })
    const graph = {
      ...createGraph(source, target),
      edges: [
        {
          id: "edge-main",
          source: source.id,
          target: target.id,
          sourceHandle: "evaluator-true",
          targetHandle: null,
          data: {
            sourceKind: source.data.kind,
            targetKind: target.data.kind,
          },
        },
      ],
    }

    const result = computeEdgeInsertion(graph, "edge-main", "evaluator")

    expect(result.ok).toBe(true)
    if (result.ok) {
      const upstream = result.nextEdges.find(
        (edge) =>
          edge.source === source.id && edge.target === result.insertedNodeId
      )
      const continuation = result.nextEdges.find(
        (edge) =>
          edge.source === result.insertedNodeId && edge.target === target.id
      )

      expect(upstream?.sourceHandle).toBe("evaluator-true")
      expect(continuation?.sourceHandle).toBe("evaluator-true")
    }
  })
})
