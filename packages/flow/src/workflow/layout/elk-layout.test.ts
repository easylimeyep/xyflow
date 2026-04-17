import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry"
import type { WorkflowGraphState } from "../types"
import { applyElkLayout, buildElkGraph, computeWorkflowAutoLayout } from "./elk-layout"

describe("workflow ELK layout adapter", () => {
  it("builds an ELK graph with branch ports and handle-aware edges", () => {
    const branchNode = createWorkflowNode("branch", { x: 0, y: 80 })
    const trueNode = createWorkflowNode("extractor", { x: 320, y: 0 })
    const falseNode = createWorkflowNode("setVariable", { x: 320, y: 160 })
    const graph = buildElkGraph(
      [branchNode, trueNode, falseNode],
      [
        {
          id: "branch-true-edge",
          source: branchNode.id,
          target: trueNode.id,
          sourceHandle: "branch-true",
          targetHandle: null,
          data: { sourceKind: "branch", targetKind: "extractor" },
        },
        {
          id: "branch-false-edge",
          source: branchNode.id,
          target: falseNode.id,
          sourceHandle: "branch-false",
          targetHandle: null,
          data: { sourceKind: "branch", targetKind: "setVariable" },
        },
      ]
    )

    const branchElkNode = graph.children.find((node) => node.id === branchNode.id)
    expect(branchElkNode?.ports?.map((port) => port.id)).toEqual([
      `${branchNode.id}::target`,
      `${branchNode.id}::source::branch-true`,
      `${branchNode.id}::source::branch-false`,
    ])
    expect(graph.edges).toEqual([
      {
        id: "branch-true-edge",
        sources: [`${branchNode.id}::source::branch-true`],
        targets: [`${trueNode.id}::target`],
      },
      {
        id: "branch-false-edge",
        sources: [`${branchNode.id}::source::branch-false`],
        targets: [`${falseNode.id}::target`],
      },
    ])
  })

  it("uses runtime dimensions when available", () => {
    const node = createWorkflowNode("extractor", { x: 0, y: 0 })
    node.measured = { width: 420, height: 210 }

    const graph = buildElkGraph([node], [])

    expect(graph.children[0]).toMatchObject({
      id: node.id,
      width: 420,
      height: 210,
    })
  })

  it("applies returned ELK coordinates to workflow nodes", async () => {
    const root = createWorkflowNode("inlineExpression", { x: 0, y: 80 }, "Keyword")
    root.data.config.isRoot = true
    const extractor = createWorkflowNode("extractor", { x: 320, y: 80 })
    const graph: WorkflowGraphState = {
      nodes: [root, extractor],
      edges: [
        {
          id: "edge-1",
          source: root.id,
          target: extractor.id,
          sourceHandle: null,
          targetHandle: null,
          data: { sourceKind: "inlineExpression", targetKind: "extractor" },
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
      document: {
        id: "doc",
        name: "Workflow",
        version: 1,
        metadata: {},
      },
    }

    const nextGraph = await computeWorkflowAutoLayout(graph, {
      layout: async () => ({
        children: [
          { id: root.id, width: 260, height: 80, x: 40, y: 20 },
          { id: extractor.id, width: 260, height: 80, x: 360, y: 120 },
        ],
      }),
    })

    expect(nextGraph.nodes.map((node) => node.position)).toEqual([
      { x: 40, y: 20 },
      { x: 360, y: 120 },
    ])
  })

  it("reuses the original node array when ELK positions do not change", () => {
    const extractor = createWorkflowNode("extractor", { x: 120, y: 40 })
    const nodes = [extractor]
    const nextNodes = applyElkLayout(nodes, {
      children: [
        {
          id: extractor.id,
          width: 260,
          height: 80,
          x: 120,
          y: 40,
        },
      ],
    })

    expect(nextNodes).toBe(nodes)
  })
})
