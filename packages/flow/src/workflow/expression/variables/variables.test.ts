import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../../node-registry/node-factory"
import type { WorkflowEdge } from "../../types/types"
import { collectWorkflowVariables } from "./variables"

describe("collectWorkflowVariables", () => {
  it("returns empty list when no selectedNodeId", () => {
    const inline = createWorkflowNode("inlineExpression", { x: 0, y: 0 }, "InlineA")
    const options = collectWorkflowVariables([inline], [], null)
    expect(options).toHaveLength(0)
  })

  it("exposes upstream extractor extractExpression as plain variable", () => {
    const extractor = createWorkflowNode("extractor", { x: 0, y: 0 }, "Extractor Title")
    extractor.data.config.extractExpression = "price"
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineA")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: extractor.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: extractor.data.kind, targetKind: inline.data.kind },
      },
    ]

    const options = collectWorkflowVariables([extractor, inline], edges, inline.id)

    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe("price")
    expect(options[0]?.label).toBe("price")
  })

  it("falls back to extractor label when extractExpression is invalid", () => {
    const extractor = createWorkflowNode("extractor", { x: 0, y: 0 }, "fallbackLabel")
    extractor.data.config.extractExpression = "{{ invalid }}"
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineA")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: extractor.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: extractor.data.kind, targetKind: inline.data.kind },
      },
    ]

    const options = collectWorkflowVariables([extractor, inline], edges, inline.id)

    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe("fallbackLabel")
  })

  it("exposes upstream setVariable variableName as plain variable", () => {
    const setVar = createWorkflowNode("setVariable", { x: 0, y: 0 }, "Setter")
    setVar.data.config.variableName = "total"
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineA")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: setVar.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: setVar.data.kind, targetKind: inline.data.kind },
      },
    ]

    const options = collectWorkflowVariables([setVar, inline], edges, inline.id)

    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe("total")
  })

  it("does not expose setVariable when variableName is missing", () => {
    const setVar = createWorkflowNode("setVariable", { x: 0, y: 0 }, "fallbackLabel")
    setVar.data.config.variableName = ""
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineA")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: setVar.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: setVar.data.kind, targetKind: inline.data.kind },
      },
    ]

    const options = collectWorkflowVariables([setVar, inline], edges, inline.id)

    expect(options).toHaveLength(0)
  })

  it("does not expose other node kinds as variables", () => {
    const inline = createWorkflowNode("inlineExpression", { x: 0, y: 0 }, "InlineA")
    const inline2 = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineB")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: inline.id,
        target: inline2.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: inline.data.kind, targetKind: inline2.data.kind },
      },
    ]

    const options = collectWorkflowVariables([inline, inline2], edges, inline2.id)
    expect(options).toHaveLength(0)
  })

  it("exposes upstream evaluator label as plain variable", () => {
    const evaluator = createWorkflowNode("evaluator", { x: 0, y: 0 }, "Evaluator")
    evaluator.data.config.label = "conditionMatched"
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineA")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: evaluator.id,
        target: inline.id,
        sourceHandle: "evaluator-true",
        targetHandle: null,
        data: { sourceKind: evaluator.data.kind, targetKind: inline.data.kind },
      },
    ]

    const options = collectWorkflowVariables([evaluator, inline], edges, inline.id)

    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe("conditionMatched")
  })

  it("does not expose empty upstream evaluator label", () => {
    const evaluator = createWorkflowNode("evaluator", { x: 0, y: 0 }, "Evaluator")
    evaluator.data.config.label = ""
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineA")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: evaluator.id,
        target: inline.id,
        sourceHandle: "evaluator-true",
        targetHandle: null,
        data: { sourceKind: evaluator.data.kind, targetKind: inline.data.kind },
      },
    ]

    const options = collectWorkflowVariables([evaluator, inline], edges, inline.id)

    expect(options.map((o) => o.value)).not.toContain("")
    expect(options.map((o) => o.value)).not.toContain("conditionMatched")
  })

  it("does not expose non-upstream evaluator labels", () => {
    const evaluator = createWorkflowNode("evaluator", { x: 0, y: 0 }, "Evaluator")
    evaluator.data.config.label = "conditionMatched"
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineA")

    const options = collectWorkflowVariables([evaluator, inline], [], inline.id)

    expect(options.map((o) => o.value)).not.toContain("conditionMatched")
  })

  it("only includes upstream nodes, not isolated ones", () => {
    const extractor = createWorkflowNode("extractor", { x: 0, y: 0 }, "price")
    const isolated = createWorkflowNode("extractor", { x: 0, y: 300 }, "isolated")
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineA")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: extractor.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: extractor.data.kind, targetKind: inline.data.kind },
      },
    ]

    const options = collectWorkflowVariables([extractor, isolated, inline], edges, inline.id)

    expect(options.map((o) => o.value)).toContain("price")
    expect(options.map((o) => o.value)).not.toContain("isolated")
  })

  it("does not include $input or $node style variables", () => {
    const extractor = createWorkflowNode("extractor", { x: 0, y: 0 }, "price")
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineA")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: extractor.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: { sourceKind: extractor.data.kind, targetKind: inline.data.kind },
      },
    ]

    const options = collectWorkflowVariables([extractor, inline], edges, inline.id)

    expect(options.every((o) => !o.value.includes("$input"))).toBe(true)
    expect(options.every((o) => !o.value.includes("$node"))).toBe(true)
    expect(options.every((o) => !o.value.includes("$vars"))).toBe(true)
  })
})
