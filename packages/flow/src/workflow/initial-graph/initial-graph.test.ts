import { describe, expect, it } from "vitest"

import { createInitialGraph, createInitialGraphElk } from "./initial-graph"

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
            caseSensitive: false,
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
            tokenNumber: 1,
            extractExpression: "email",
            variableType: "value",
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

  it("orders evaluator descendants using output handle order", () => {
    const graph = createInitialGraph({
      nodes: [
        { id: "keyword", kind: "inlineExpression", config: { isRoot: true } },
        {
          id: "evaluator",
          kind: "evaluator",
          config: {
            conditions: [
              {
                id: "condition-1",
                left: { type: "value", value: "{{ email }}" },
                operator: "contains",
                right: { type: "value", value: "@" },
              },
            ],
          },
        },
        { id: "true-result", kind: "result", config: { category: "true" } },
        { id: "false-result", kind: "result", config: { category: "false" } },
      ],
      edges: [
        { source: "keyword", target: "evaluator" },
        {
          source: "evaluator",
          sourceHandle: "evaluator-true",
          target: "true-result",
        },
        {
          source: "evaluator",
          sourceHandle: "evaluator-false",
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
      edges: [
        { id: "keyword-to-extractor", source: "keyword", target: "extractor" },
      ],
    })

    expect(graph.nodes.map((node) => node.id)).toEqual(["keyword", "extractor"])
    expect(graph.edges.map((edge) => edge.id)).toEqual(["keyword-to-extractor"])
    expect(graph.nodes).toHaveLength(2)
    expect(graph.nodes[0]!.position).not.toEqual(graph.nodes[1]!.position)
  })

  it("keeps ELK-backed initial graph edges connected to nodes and handles", async () => {
    const graph = await createInitialGraphElk({
      nodes: [
        { id: "keyword", kind: "inlineExpression", config: { isRoot: true } },
        {
          id: "auto-approve",
          kind: "evaluator",
          label: "Auto approve?",
          config: {
            conditions: [
              {
                id: "condition-1",
                left: { type: "value", value: "{{ score }}" },
                operator: "is greater than",
                right: { type: "value", value: "90" },
              },
            ],
          },
        },
        {
          id: "extract-score",
          kind: "extractor",
          label: "Extract approval score",
        },
        { id: "result-true", kind: "result", label: "result true" },
      ],
      edges: [
        {
          id: "keyword-to-evaluator",
          source: "keyword",
          target: "auto-approve",
        },
        {
          id: "approval-true",
          source: "auto-approve",
          sourceHandle: "evaluator-true",
          target: "extract-score",
        },
        {
          id: "approval-false-shortcut",
          source: "auto-approve",
          sourceHandle: "evaluator-false",
          target: "result-true",
        },
      ],
    })

    expect(graph.edges).toEqual([
      expect.objectContaining({
        id: "keyword-to-evaluator",
        source: "keyword",
        target: "auto-approve",
        sourceHandle: null,
        targetHandle: null,
      }),
      expect.objectContaining({
        id: "approval-true",
        source: "auto-approve",
        target: "extract-score",
        sourceHandle: "evaluator-true",
        targetHandle: null,
      }),
      expect.objectContaining({
        id: "approval-false-shortcut",
        source: "auto-approve",
        target: "result-true",
        sourceHandle: "evaluator-false",
        targetHandle: null,
      }),
    ])
  })
})
