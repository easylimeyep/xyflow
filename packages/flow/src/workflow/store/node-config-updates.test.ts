import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowGraphState } from "../types/types"
import { applyNodeConfigUpdate } from "./node-config-updates"

function createGraph(
  nodes = [createWorkflowNode("inlineExpression", { x: 0, y: 0 })]
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
    const inlineNode = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    const graph = createGraph([inlineNode])

    const result = applyNodeConfigUpdate(graph, inlineNode.id, {
      kind: "extractor",
      key: "tokenNumber",
      value: 10,
    })

    expect(result.nextGraph).toBeNull()
    expect(result.error?.code).toBe("INVALID_NODE_CONFIG_KIND")
  })

  it("renames set-variable references across graph", () => {
    const setVariableNode = createWorkflowNode("setVariable", { x: 0, y: 0 })
    setVariableNode.data.config.variableName = "oldName"
    const inlineExpressionNode = createWorkflowNode("inlineExpression", { x: 200, y: 0 })
    inlineExpressionNode.data.config.template = "{{ $vars.oldName }} + {{ $node(\"" + setVariableNode.data.label + "\").item.json.oldName }}"

    const graph = createGraph([setVariableNode, inlineExpressionNode])
    const result = applyNodeConfigUpdate(graph, setVariableNode.id, {
      kind: "setVariable",
      key: "variableName",
      value: "newName",
    })

    expect(result.error).toBeNull()
    expect(result.nextGraph?.nodes[0]?.data.config.variableName).toBe("newName")
    expect(result.nextGraph?.nodes[1]?.data.config.template).toContain("$vars.newName")
    expect(result.nextGraph?.nodes[1]?.data.config.template).toContain(
      `$node("${setVariableNode.data.label}").item.json.newName`
    )
  })

  it("prunes incoming edges when inlineExpression becomes root", () => {
    const sourceNode = createWorkflowNode("setVariable", { x: 0, y: 0 })
    const targetNode = createWorkflowNode("inlineExpression", { x: 200, y: 0 })
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

    const result = applyNodeConfigUpdate(graph, targetNode.id, {
      kind: "inlineExpression",
      key: "isRoot",
      value: true,
    })

    expect(result.error).toBeNull()
    expect(result.nextGraph?.nodes.find((node) => node.id === targetNode.id)?.data.config.isRoot).toBe(
      true
    )
    expect(result.nextGraph?.edges).toHaveLength(0)
  })
})
