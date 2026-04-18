import { describe, expect, it } from "vitest"

import {
  createInitialGraph,
  createInitialGraphElk,
} from "./initial-graph"

describe("initial graph builders", () => {
  it("normalizes node defaults, edge metadata, document, and viewport", () => {
    const graph = createInitialGraph({
      nodes: [
        {
          id: "keyword",
          kind: "inlineExpression",
          config: {
            template: ["lead"],
            isRoot: true,
          },
        },
        {
          id: "extractor",
          kind: "extractor",
          config: {
            extractExpression: "email",
          },
        },
      ],
      edges: [{ source: "keyword", target: "extractor" }],
    })

    expect(graph.document).toEqual({
      id: "workflow-initial",
      name: "Untitled Workflow",
      version: 1,
      metadata: {},
    })
    expect(graph.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
    expect(graph.nodes).toEqual([
      expect.objectContaining({
        id: "keyword",
        type: "inlineExpression",
        width: 260,
        data: {
          kind: "inlineExpression",
          label: "Keyword",
          config: {
            template: ["lead"],
            isRoot: true,
            repeatable: false,
          },
        },
      }),
      expect.objectContaining({
        id: "extractor",
        type: "extractor",
        width: 260,
        data: {
          kind: "extractor",
          label: "Extractor",
          config: {
            tokenNumber: 0,
            extractExpression: "email",
            unlimited: false,
          },
        },
      }),
    ])
    expect(graph.edges).toEqual([
      expect.objectContaining({
        source: "keyword",
        target: "extractor",
        data: {
          sourceKind: "inlineExpression",
          targetKind: "extractor",
        },
      }),
    ])
  })

  it("fails clearly when an edge references a missing node", () => {
    expect(() =>
      createInitialGraph({
        nodes: [{ id: "keyword", kind: "inlineExpression" }],
        edges: [{ source: "keyword", target: "missing-node" }],
      })
    ).toThrowError(
      "Invalid initial graph edge keyword:default->missing-node:default (#1): Connection references an unknown node."
    )
  })

  it("builds deterministic linear layout positions", () => {
    const input = {
      nodes: [
        { id: "keyword", kind: "inlineExpression", config: { isRoot: true } },
        { id: "extractor", kind: "extractor" },
        { id: "setter", kind: "setVariable" },
      ],
      edges: [
        { source: "keyword", target: "extractor" },
        { source: "extractor", target: "setter" },
      ],
    } as const

    const first = createInitialGraph(input)
    const second = createInitialGraph(input)

    expect(first.nodes.map((node) => node.position)).toEqual(
      second.nodes.map((node) => node.position)
    )
    expect(first.nodes.map((node) => node.position)).toEqual([
      { x: 0, y: 80 },
      { x: 320, y: 80 },
      { x: 640, y: 80 },
    ])
  })

  it("orders branch descendants using output handle order", () => {
    const graph = createInitialGraph({
      nodes: [
        { id: "keyword", kind: "inlineExpression", config: { isRoot: true } },
        {
          id: "branch",
          kind: "branch",
          config: {
            conditions: [
              {
                id: "condition-1",
                value: "{{ email }}",
                operator: "contains",
                targetValue: "@",
              },
            ],
          },
        },
        { id: "true-result", kind: "result", config: { category: "true" } },
        { id: "false-result", kind: "result", config: { category: "false" } },
      ],
      edges: [
        { source: "keyword", target: "branch" },
        {
          source: "branch",
          sourceHandle: "branch-true",
          target: "true-result",
        },
        {
          source: "branch",
          sourceHandle: "branch-false",
          target: "false-result",
        },
      ],
    })

    const trueResult = graph.nodes.find((node) => node.id === "true-result")
    const falseResult = graph.nodes.find((node) => node.id === "false-result")

    expect(trueResult?.position.y).toBeLessThan(falseResult?.position.y ?? 0)
  })

  it("reuses ELK auto-layout while preserving node and edge identity", async () => {
    const graph = await createInitialGraphElk({
      nodes: [
        { id: "keyword", kind: "inlineExpression", config: { isRoot: true } },
        { id: "extractor", kind: "extractor" },
      ],
      edges: [{ id: "keyword-to-extractor", source: "keyword", target: "extractor" }],
    })

    expect(graph.nodes.map((node) => node.id)).toEqual(["keyword", "extractor"])
    expect(graph.edges.map((edge) => edge.id)).toEqual(["keyword-to-extractor"])
    expect(graph.nodes).toHaveLength(2)
    expect(graph.nodes[0]!.position).not.toEqual(graph.nodes[1]!.position)
  })
})
