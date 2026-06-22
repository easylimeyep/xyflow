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

  it("supports cyclic inputs while preserving cyclic edge connectivity", () => {
    const graph = createInitialGraph({
      nodes: [
        { id: "evaluator", kind: "evaluator" },
        { id: "inline", kind: "inlineExpression" },
      ],
      edges: [
        {
          id: "evaluator-to-inline",
          source: "evaluator",
          sourceHandle: "evaluator-true",
          target: "inline",
        },
        { id: "inline-to-evaluator", source: "inline", target: "evaluator" },
      ],
    })

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "evaluator-to-inline",
          source: "evaluator",
          target: "inline",
        }),
        expect.objectContaining({
          id: "inline-to-evaluator",
          source: "inline",
          target: "evaluator",
        }),
      ])
    )
  })

  it("uses ELK auto-layout while preserving node and edge identity", async () => {
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

  it("keeps createInitialGraphElk node and edge identity aligned with createInitialGraph", async () => {
    const input = {
      nodes: [
        { id: "keyword", kind: "inlineExpression", config: { isRoot: true } },
        { id: "extractor", kind: "extractor" },
      ],
      edges: [{ id: "keyword-to-extractor", source: "keyword", target: "extractor" }],
    } as const
    const base = createInitialGraph(input)
    const elk = await createInitialGraphElk(input)

    // The ELK builder changes positions, but node IDs and edge wiring stay stable.
    expect(elk.nodes.map((node) => node.id)).toEqual(base.nodes.map((node) => node.id))
    expect(elk.edges).toEqual(base.edges)
  })
})
