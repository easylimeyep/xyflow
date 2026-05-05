import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry"
import type { WorkflowGraphState } from "../types"
import {
  applyBranchShortcutClearance,
  applyElkLayout,
  buildElkGraph,
  computeWorkflowAutoLayout,
} from "./elk-layout"

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

    const branchElkNode = graph.children.find(
      (node) => node.id === branchNode.id
    )
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

  it("uses estimated extractor height before runtime dimensions are measured", () => {
    const node = createWorkflowNode("extractor", { x: 0, y: 0 })

    const graph = buildElkGraph([node], [])

    expect(graph.children[0]).toMatchObject({
      id: node.id,
      width: 260,
      height: 195,
    })
  })

  it("uses branch condition count to estimate unmeasured branch height", () => {
    const singleConditionBranch = createWorkflowNode("branch", { x: 0, y: 0 })
    const multiConditionBranch = createWorkflowNode("branch", { x: 0, y: 0 })
    multiConditionBranch.data.config.conditions = [
      {
        id: "condition-1",
        value: "{{ score }}",
        operator: "contains",
        targetValue: "a",
      },
      {
        id: "condition-2",
        value: "{{ score }}",
        operator: "contains",
        targetValue: "b",
      },
      {
        id: "condition-3",
        value: "{{ score }}",
        operator: "contains",
        targetValue: "c",
      },
    ]

    const graph = buildElkGraph(
      [singleConditionBranch, multiConditionBranch],
      []
    )
    const singleConditionElkNode = graph.children.find(
      (node) => node.id === singleConditionBranch.id
    )
    const multiConditionElkNode = graph.children.find(
      (node) => node.id === multiConditionBranch.id
    )

    expect(singleConditionElkNode?.height).toBeGreaterThan(80)
    expect(multiConditionElkNode?.height).toBeGreaterThan(
      singleConditionElkNode?.height ?? 0
    )
  })

  it("applies returned ELK coordinates to workflow nodes", async () => {
    const root = createWorkflowNode(
      "inlineExpression",
      { x: 0, y: 80 },
      "Keyword"
    )
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
    expect(nextGraph.edges).toBe(graph.edges)
  })

  it("requests wider ELK spacing for dense workflow layouts", () => {
    const node = createWorkflowNode("extractor", { x: 0, y: 0 })
    const graph = buildElkGraph([node], [])

    expect(graph.layoutOptions).toMatchObject({
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.spacing.nodeNodeBetweenLayers": "160",
      "elk.spacing.nodeNode": "112",
      "elk.spacing.edgeNode": "48",
      "elk.spacing.edgeEdge": "24",
    })
  })

  it("moves branch shortcut result targets away from sibling path nodes", () => {
    const branch = createWorkflowNode("branch", { x: 0, y: 100 }, "Auto approve?")
    const score = createWorkflowNode("extractor", { x: 360, y: 80 }, "Extract approval score")
    const summary = createWorkflowNode("setVariable", { x: 720, y: 80 }, "Set true summary")
    const result = createWorkflowNode("result", { x: 1080, y: 80 }, "result true")

    score.measured = { width: 260, height: 120 }
    summary.measured = { width: 260, height: 120 }
    result.measured = { width: 260, height: 100 }

    const nodes = [branch, score, summary, result]
    const edges = [
      {
        id: "true-path",
        source: branch.id,
        target: score.id,
        sourceHandle: "branch-true",
        targetHandle: null,
        data: { sourceKind: "branch", targetKind: "extractor" },
      },
      {
        id: "score-to-summary",
        source: score.id,
        target: summary.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: "extractor", targetKind: "setVariable" },
      },
      {
        id: "summary-to-result",
        source: summary.id,
        target: result.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: "setVariable", targetKind: "result" },
      },
      {
        id: "false-shortcut",
        source: branch.id,
        target: result.id,
        sourceHandle: "branch-false",
        targetHandle: null,
        data: { sourceKind: "branch", targetKind: "result" },
      },
    ]

    const nextNodes = applyBranchShortcutClearance(nodes, edges)
    const nextScore = nextNodes.find((node) => node.id === score.id)
    const nextSummary = nextNodes.find((node) => node.id === summary.id)
    const nextResult = nextNodes.find((node) => node.id === result.id)

    expect(nextScore?.position.y).toBeCloseTo(23.84)
    expect(nextSummary?.position.y).toBeCloseTo(23.84)
    expect(nextResult?.position.y).toBeCloseTo(383.84)
    expect(
      edges.map((edge) => [edge.source, edge.target, edge.sourceHandle])
    ).toEqual([
      [branch.id, score.id, "branch-true"],
      [score.id, summary.id, null],
      [summary.id, result.id, null],
      [branch.id, result.id, "branch-false"],
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
