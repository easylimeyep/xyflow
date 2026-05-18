import { describe, expect, it } from "vitest"

import { exportDomainWorkflowForBackend } from "./backend-export"
import type { DomainWorkflowConnectionDTO, DomainWorkflowDTO, DomainWorkflowNodeDTO } from "../../types"

function node(
  id: string,
  kind: DomainWorkflowNodeDTO["kind"],
  x: number,
  y: number,
  config: DomainWorkflowNodeDTO["config"] = {}
): DomainWorkflowNodeDTO {
  return {
    id,
    kind,
    position: { x, y },
    label: id,
    config,
  }
}

function connection(
  sourceNodeId: string,
  targetNodeId: string,
  sourceHandle: string | null = null
): DomainWorkflowConnectionDTO {
  return {
    id: `${sourceNodeId}-${sourceHandle ?? "default"}-${targetNodeId}`,
    sourceNodeId,
    targetNodeId,
    sourceHandle,
    targetHandle: null,
  }
}

function workflow(
  nodes: DomainWorkflowNodeDTO[],
  connections: DomainWorkflowConnectionDTO[]
): DomainWorkflowDTO {
  return {
    id: "workflow-1",
    name: "Workflow",
    version: 1,
    metadata: { source: "test" },
    nodes,
    connections,
    viewport: { x: 0, y: 0, zoom: 1 },
  }
}

describe("exportDomainWorkflowForBackend", () => {
  it("orders a linear graph by topology and remaps links to numeric ids", () => {
    const root = node("root", "inlineExpression", 0, 0, { isRoot: true })
    const step = node("step", "setVariable", 200, 0, { variableName: "value", valueExpression: "{{ root }}" })
    const result = node("result", "result", 400, 0, { category: "true" })
    const dto = workflow(
      [result, step, root],
      [connection("root", "step"), connection("step", "result")]
    )

    const backend = exportDomainWorkflowForBackend(dto)

    expect(backend).toMatchObject({
      id: "workflow-1",
      name: "Workflow",
      version: 1,
      metadata: { source: "test" },
    })
    expect(backend.nodes.map((backendNode) => backendNode.id)).toEqual([1, 2, 3])
    expect(backend.nodes.map((backendNode) => backendNode.label)).toEqual([
      "root",
      "step",
      "result",
    ])
    expect(backend.nodes[0]).toMatchObject({ id: 1, next: [2] })
    expect(backend.nodes[1]).toMatchObject({ id: 2, next: [3] })
    expect(backend.nodes[2]).toMatchObject({
      id: 3,
      position: { x: 400, y: 0 },
      config: { category: "true" },
      next: [],
    })
  })

  it("orders multiple roots before a shared downstream node", () => {
    const rootB = node("root-b", "inlineExpression", 0, 100, { isRoot: true })
    const rootA = node("root-a", "inlineExpression", 0, 0, { isRoot: true })
    const shared = node("shared", "extractor", 300, 0, {
      tokenNumber: 1,
      extractExpression: "{{ value }}",
      unlimited: false,
    })
    const result = node("result", "result", 600, 0, { category: "false" })
    const dto = workflow(
      [result, shared, rootB, rootA],
      [
        connection("root-a", "shared"),
        connection("root-b", "shared"),
        connection("shared", "result"),
      ]
    )

    const backend = exportDomainWorkflowForBackend(dto)

    expect(backend.nodes.map((backendNode) => backendNode.label)).toEqual([
      "root-a",
      "root-b",
      "shared",
      "result",
    ])
    expect(backend.nodes[0]).toMatchObject({ next: [3] })
    expect(backend.nodes[1]).toMatchObject({ next: [3] })
    expect(backend.nodes[2]).toMatchObject({ next: [4] })
    expect(backend.nodes[3]).toMatchObject({ next: [] })
  })

  it("maps evaluator branches to scalar true and false links", () => {
    const root = node("root", "inlineExpression", 0, 0, { isRoot: true })
    const evaluator = node("evaluator", "evaluator", 200, 0, {
      conditions: [],
      logicalOperator: "and",
      caseSensitive: false,
    })
    const trueResult = node("true-result", "result", 400, -100, { category: "true" })
    const falseResult = node("false-result", "result", 400, 100, { category: "false" })
    const dto = workflow(
      [falseResult, trueResult, evaluator, root],
      [
        connection("root", "evaluator"),
        connection("evaluator", "true-result", "evaluator-true"),
        connection("evaluator", "false-result", "evaluator-false"),
      ]
    )

    const backend = exportDomainWorkflowForBackend(dto)

    expect(backend.nodes[1]).toMatchObject({
      id: 2,
      kind: "evaluator",
      next_true: 3,
      next_false: 4,
    })
    expect(backend.nodes[2]).toMatchObject({ id: 3, next: [] })
    expect(backend.nodes[3]).toMatchObject({ id: 4, next: [] })
  })

  it("preserves variable metadata in backend node configs", () => {
    const root = node("root", "inlineExpression", 0, 0, { isRoot: true })
    const extractor = node("extractor", "extractor", 200, 0, {
      tokenNumber: 1,
      extractExpression: "emails",
      variableType: "array",
      unlimited: true,
    })
    const setter = node("setter", "setVariable", 400, 0, {
      variableName: "emails",
      variableType: "array",
      valueExpression: "{{ rawEmails }}",
      clear: true,
    })
    const evaluator = node("evaluator", "evaluator", 600, 0, {
      label: "hasEmails",
      conditions: [
        {
          id: "cond-1",
          left: { type: "array", value: ["a", "b"] },
          operator: "contains",
          right: { type: "string", value: "a" },
        },
      ],
      logicalOperator: "and",
      caseSensitive: false,
    })
    const dto = workflow(
      [evaluator, setter, extractor, root],
      [
        connection("root", "extractor"),
        connection("extractor", "setter"),
        connection("setter", "evaluator"),
      ]
    )

    const backend = exportDomainWorkflowForBackend(dto)

    expect(backend.nodes[1]?.config).toMatchObject({
      extractExpression: "emails",
      variableType: "array",
      unlimited: true,
    })
    expect(backend.nodes[2]?.config).toMatchObject({
      variableName: "emails",
      variableType: "array",
      valueExpression: "{{ rawEmails }}",
      clear: true,
    })
    expect(backend.nodes[3]?.config).toMatchObject({
      label: "hasEmails",
      conditions: [
        {
          id: "cond-1",
          left: { type: "array", value: ["a", "b"] },
          operator: "contains",
          right: { type: "string", value: "a" },
        },
      ],
    })
  })

  it("uses null for missing evaluator branches", () => {
    const root = node("root", "inlineExpression", 0, 0, { isRoot: true })
    const evaluator = node("evaluator", "evaluator", 200, 0, {
      conditions: [],
      logicalOperator: "and",
      caseSensitive: false,
    })
    const result = node("result", "result", 400, 0, { category: "true" })
    const dto = workflow(
      [root, evaluator, result],
      [
        connection("root", "evaluator"),
        connection("evaluator", "result", "evaluator-true"),
      ]
    )

    const backend = exportDomainWorkflowForBackend(dto)

    expect(backend.nodes[1]).toMatchObject({
      next_true: 3,
      next_false: null,
    })
  })

  it("rejects graphs without roots", () => {
    const dto = workflow([node("step", "setVariable", 0, 0)], [])

    expect(() => exportDomainWorkflowForBackend(dto)).toThrow("root")
  })

  it("rejects root nodes with incoming connections", () => {
    const root = node("root", "inlineExpression", 200, 0, { isRoot: true })
    const source = node("source", "setVariable", 0, 0)
    const dto = workflow([source, root], [connection("source", "root")])

    expect(() => exportDomainWorkflowForBackend(dto)).toThrow("incoming")
  })

  it("rejects connections with unknown endpoints", () => {
    const root = node("root", "inlineExpression", 0, 0, { isRoot: true })
    const dto = workflow([root], [connection("root", "missing")])

    expect(() => exportDomainWorkflowForBackend(dto)).toThrow("unknown")
  })

  it("rejects unreachable nodes", () => {
    const root = node("root", "inlineExpression", 0, 0, { isRoot: true })
    const unreachable = node("unreachable", "setVariable", 200, 0)
    const dto = workflow([root, unreachable], [])

    expect(() => exportDomainWorkflowForBackend(dto)).toThrow("unreachable")
  })

  it("rejects cyclic reachable graphs", () => {
    const root = node("root", "inlineExpression", 0, 0, { isRoot: true })
    const a = node("a", "setVariable", 200, 0)
    const b = node("b", "extractor", 400, 0)
    const dto = workflow(
      [root, a, b],
      [connection("root", "a"), connection("a", "b"), connection("b", "a")]
    )

    expect(() => exportDomainWorkflowForBackend(dto)).toThrow("cycle")
  })

  it("rejects duplicate evaluator true or false branches", () => {
    const root = node("root", "inlineExpression", 0, 0, { isRoot: true })
    const evaluator = node("evaluator", "evaluator", 200, 0)
    const first = node("first", "result", 400, 0)
    const second = node("second", "result", 400, 100)
    const dto = workflow(
      [root, evaluator, first, second],
      [
        connection("root", "evaluator"),
        connection("evaluator", "first", "evaluator-true"),
        connection("evaluator", "second", "evaluator-true"),
      ]
    )

    expect(() => exportDomainWorkflowForBackend(dto)).toThrow("duplicate")
  })
})
