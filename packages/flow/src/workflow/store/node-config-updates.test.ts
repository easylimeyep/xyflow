import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowGraphState } from "../types/types"
import { applyNodeConfigUpdate } from "./node-config-updates"
import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../node-registry/registry"

const registry = createNodeRegistry(builtinBaseDefinitions)

function createGraph(
  nodes = [createWorkflowNode(registry, "inlineExpression", { x: 0, y: 0 })]
): WorkflowGraphState {
  return {
    nodes,
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    document: {
      id: "doc-1",
      name: "Workflow",
      version: 1,
      metadata: {},
    },
  }
}

describe("applyNodeConfigUpdate", () => {
  it("returns error for mismatched node kind payload", () => {
    const inlineNode = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    const graph = createGraph([inlineNode])

    const result = applyNodeConfigUpdate(registry, graph, inlineNode.id, {
      kind: "extractor",
      key: "tokenNumber",
      value: 10,
    })

    expect(result.nextGraph).toBeNull()
    expect(result.error?.code).toBe("INVALID_NODE_CONFIG_KIND")
  })

  it("updates set-variable expression config field", () => {
    const setVariableNode = createWorkflowNode(registry, "setVariable", {
      x: 0,
      y: 0,
    })
    const inlineNode = createWorkflowNode(registry, "inlineExpression", {
      x: 300,
      y: 0,
    })
    setVariableNode.data.config.variableName = "oldName"
    setVariableNode.data.config.valueExpression = "{{ oldValue }}"
    inlineNode.data.config.template = ["{{ oldName }}"]

    const graph = createGraph([setVariableNode, inlineNode])
    const result = applyNodeConfigUpdate(registry, graph, setVariableNode.id, {
      kind: "setVariable",
      key: "valueExpression",
      value: "{{ newValue }}",
    })

    expect(result.error).toBeNull()
    expect(result.nextGraph?.nodes[0]?.data.config.valueExpression).toBe(
      "{{ newValue }}"
    )
    expect(result.nextGraph?.nodes[1]?.data.config.template).toEqual([
      "{{ oldName }}",
    ])
  })

  it("updates evaluator caseSensitive config field", () => {
    const evaluatorNode = createWorkflowNode(registry, "evaluator", {
      x: 0,
      y: 0,
    })
    const graph = createGraph([evaluatorNode])
    const result = applyNodeConfigUpdate(registry, graph, evaluatorNode.id, {
      kind: "evaluator",
      key: "caseSensitive",
      value: true,
    })

    expect(result.error).toBeNull()
    expect(result.nextGraph?.nodes[0]?.data.config.caseSensitive).toBe(true)
  })

  it("refactors plain variable references for rename-aware config key updates", () => {
    const setVariableNode = createWorkflowNode(registry, "setVariable", {
      x: 0,
      y: 0,
    })
    const inlineNode = createWorkflowNode(registry, "inlineExpression", {
      x: 300,
      y: 0,
    })
    setVariableNode.data.config.variableName = "oldName"
    inlineNode.data.config.template = ["{{ oldName }}"]

    const graph = createGraph([setVariableNode, inlineNode])
    const result = applyNodeConfigUpdate(registry, graph, setVariableNode.id, {
      kind: "setVariable",
      key: "variableName",
      value: "newName",
    })

    expect(result.error).toBeNull()
    expect(result.nextGraph?.nodes[0]?.data.config.variableName).toBe("newName")
    expect(result.nextGraph?.nodes[1]?.data.config.template).toEqual([
      "{{ newName }}",
    ])
  })

  it("refactors plain variable references when extractor Label is renamed", () => {
    const extractorNode = createWorkflowNode(registry, "extractor", {
      x: 0,
      y: 0,
    })
    const inlineNode = createWorkflowNode(registry, "inlineExpression", {
      x: 300,
      y: 0,
    })
    extractorNode.data.config.extractExpression = "oldName"
    inlineNode.data.config.template = ["{{ oldName }}"]

    const graph = createGraph([extractorNode, inlineNode])
    const result = applyNodeConfigUpdate(registry, graph, extractorNode.id, {
      kind: "extractor",
      key: "extractExpression",
      value: "newName",
    })

    expect(result.error).toBeNull()
    expect(result.nextGraph?.nodes[0]?.data.config.extractExpression).toBe(
      "newName"
    )
    expect(result.nextGraph?.nodes[1]?.data.config.template).toEqual([
      "{{ newName }}",
    ])
  })

  it("refactors plain variable references when evaluator Label is renamed", () => {
    const evaluatorNode = createWorkflowNode(registry, "evaluator", {
      x: 0,
      y: 0,
    })
    const inlineNode = createWorkflowNode(registry, "inlineExpression", {
      x: 300,
      y: 0,
    })
    evaluatorNode.data.config.label = "conditionMatched"
    inlineNode.data.config.template = ["{{ conditionMatched }}"]

    const graph = createGraph([evaluatorNode, inlineNode])
    const result = applyNodeConfigUpdate(registry, graph, evaluatorNode.id, {
      kind: "evaluator",
      key: "label",
      value: "isQualified",
    })

    expect(result.error).toBeNull()
    expect(result.nextGraph?.nodes[0]?.data.config.label).toBe("isQualified")
    expect(result.nextGraph?.nodes[1]?.data.config.template).toEqual([
      "{{ isQualified }}",
    ])
  })

  it("does not blank plain variable references when evaluator Label is cleared", () => {
    const evaluatorNode = createWorkflowNode(registry, "evaluator", {
      x: 0,
      y: 0,
    })
    const inlineNode = createWorkflowNode(registry, "inlineExpression", {
      x: 300,
      y: 0,
    })
    evaluatorNode.data.config.label = "conditionMatched"
    inlineNode.data.config.template = ["{{ conditionMatched }}"]

    const graph = createGraph([evaluatorNode, inlineNode])
    const result = applyNodeConfigUpdate(registry, graph, evaluatorNode.id, {
      kind: "evaluator",
      key: "label",
      value: "",
    })

    expect(result.error).toBeNull()
    expect(result.nextGraph?.nodes[0]?.data.config.label).toBe("")
    expect(result.nextGraph?.nodes[1]?.data.config.template).toEqual([
      "{{ conditionMatched }}",
    ])
  })

  it("does not refactor references on extractor non-rename config updates", () => {
    const extractorNode = createWorkflowNode(registry, "extractor", {
      x: 0,
      y: 0,
    })
    const inlineNode = createWorkflowNode(registry, "inlineExpression", {
      x: 300,
      y: 0,
    })
    extractorNode.data.config.extractExpression = "oldName"
    inlineNode.data.config.template = ["{{ oldName }}"]

    const graph = createGraph([extractorNode, inlineNode])
    const result = applyNodeConfigUpdate(registry, graph, extractorNode.id, {
      kind: "extractor",
      key: "tokenNumber",
      value: 10,
    })

    expect(result.error).toBeNull()
    expect(result.nextGraph?.nodes[0]?.data.config.tokenNumber).toBe(10)
    expect(result.nextGraph?.nodes[1]?.data.config.template).toEqual([
      "{{ oldName }}",
    ])
  })

  it("prunes incoming edges when inlineExpression becomes root", () => {
    const sourceNode = createWorkflowNode(registry, "setVariable", {
      x: 0,
      y: 0,
    })
    const targetNode = createWorkflowNode(registry, "inlineExpression", {
      x: 200,
      y: 0,
    })
    const graph = createGraph([sourceNode, targetNode])
    graph.edges = [
      {
        id: "edge-1",
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: sourceNode.data.kind,
          targetKind: targetNode.data.kind,
        },
      },
    ]

    const result = applyNodeConfigUpdate(registry, graph, targetNode.id, {
      kind: "inlineExpression",
      key: "isRoot",
      value: true,
    })

    expect(result.error).toBeNull()
    expect(
      result.nextGraph?.nodes.find((node) => node.id === targetNode.id)?.data
        .config.isRoot
    ).toBe(true)
    expect(result.nextGraph?.edges).toHaveLength(0)
  })
})
