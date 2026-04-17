import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowGraphState } from "../types/types"

import {
  applyAddNodeCommand,
  applyConnectNodesCommand,
  applyInsertNodeOnEdgeCommand,
  applyNodeChangesCommand,
  applyUpdateNodeConfigCommand,
  applyUpdateNodeLabelCommand,
} from "./commands"
import { buildNodeTypes } from "../node-registry/node-types-builder"
import { nodeRegistry } from "../node-registry/registry"

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

describe("graph-engine commands", () => {
  it("adds nodes deterministically when command provides a node id", () => {
    const graph = createGraph()
    const command = {
      kind: "setVariable" as const,
      position: { x: 240, y: 80 },
      nodeId: "set-variable-fixed",
    }

    const first = applyAddNodeCommand(graph, command)
    const second = applyAddNodeCommand(graph, command)

    expect(first).toEqual(second)
    expect(first.ok).toBe(true)
    if (first.ok) {
      expect(first.nextGraph.nodes.at(-1)?.id).toBe("set-variable-fixed")
    }
  })

  it("rejects invalid kind/key config updates without mutating graph state", () => {
    const inlineNode = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    const graph = createGraph([inlineNode])

    const result = applyUpdateNodeConfigCommand(graph, {
      nodeId: inlineNode.id,
      update: {
        kind: "extractor",
        key: "tokenNumber",
        value: 10,
      },
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_NODE_CONFIG_KIND")
    }
    expect(graph.nodes[0]?.data.config.template).toEqual([])
  })

  it("rejects unsupported config keys for a node kind", () => {
    const inlineNode = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    const graph = createGraph([inlineNode])

    const result = applyUpdateNodeConfigCommand(graph, {
      nodeId: inlineNode.id,
      update: {
        kind: "inlineExpression",
        key: "tokenNumber" as never,
        value: 10 as never,
      },
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_NODE_CONFIG_KEY")
    }
  })

  it("rejects invalid config values for a supported key", () => {
    const resultNode = createWorkflowNode("result", { x: 0, y: 0 })
    const graph = createGraph([resultNode])

    const result = applyUpdateNodeConfigCommand(graph, {
      nodeId: resultNode.id,
      update: {
        kind: "result",
        key: "category",
        value: "maybe" as never,
      },
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_NODE_CONFIG_VALUE")
    }
  })

  it("refactors plain variable references for rename-aware config updates", () => {
    const setVariableNode = createWorkflowNode("setVariable", { x: 0, y: 0 })
    const inlineNode = createWorkflowNode("inlineExpression", { x: 300, y: 0 })
    setVariableNode.data.config.variableName = "oldName"
    inlineNode.data.config.template = ["{{ oldName }}"]

    const graph = createGraph([setVariableNode, inlineNode])
    const result = applyUpdateNodeConfigCommand(graph, {
      nodeId: setVariableNode.id,
      update: {
        kind: "setVariable",
        key: "variableName",
        value: "newName",
      },
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.nextGraph.nodes[0]?.data.config.variableName).toBe("newName")
      expect(result.nextGraph.nodes[1]?.data.config.template).toEqual(["{{ newName }}"])
    }
  })

  it("refactors plain variable references when rename-aware node labels change", () => {
    const extractorNode = createWorkflowNode("extractor", { x: 0, y: 0 }, "oldName")
    const inlineNode = createWorkflowNode("inlineExpression", { x: 300, y: 0 })
    inlineNode.data.config.template = ["{{ oldName }}"]

    const graph = createGraph([extractorNode, inlineNode])
    const result = applyUpdateNodeLabelCommand(graph, {
      nodeId: extractorNode.id,
      nextLabel: "newName",
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.nextGraph.nodes[0]?.data.label).toBe("newName")
      expect(result.nextGraph.nodes[1]?.data.config.template).toEqual(["{{ newName }}"])
    }
  })

  it("connects nodes through the pure engine command", () => {
    const source = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    source.data.config.isRoot = true
    const target = createWorkflowNode("extractor", { x: 320, y: 0 })
    const graph = createGraph([source, target])

    const result = applyConnectNodesCommand(graph, {
      connection: {
        source: source.id,
        target: target.id,
      },
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.nextGraph.edges).toHaveLength(1)
      expect(result.nextGraph.edges[0]?.data).toEqual({
        sourceKind: "inlineExpression",
        targetKind: "extractor",
      })
    }
  })

  it("splits edges deterministically when insertion command provides a node id", () => {
    const source = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    const target = createWorkflowNode("inlineExpression", { x: 320, y: 0 })
    source.data.config.isRoot = true
    const graph = {
      ...createGraph([source, target]),
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
    }

    const command = {
      edgeId: "edge-main",
      kind: "extractor" as const,
      nodeId: "inserted-node-fixed",
    }
    const first = applyInsertNodeOnEdgeCommand(graph, command)
    const second = applyInsertNodeOnEdgeCommand(graph, command)

    expect(first).toEqual(second)
    expect(first.ok).toBe(true)
    if (first.ok) {
      expect(first.nextGraph.nodes.some((node) => node.id === "inserted-node-fixed")).toBe(true)
    }
  })

  it("applies structural node changes through a pure engine command", () => {
    const source = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    const target = createWorkflowNode("extractor", { x: 320, y: 0 })
    const graph = {
      ...createGraph([source, target]),
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
    }

    const result = applyNodeChangesCommand(graph, {
      changes: [{ id: target.id, type: "remove" }],
      selectedNodeIds: [source.id, target.id],
    })

    expect(result.ok).toBe(true)
    expect(result.nextGraph.nodes.some((node) => node.id === target.id)).toBe(false)
    expect(result.nextGraph.edges).toHaveLength(0)
    expect(result.nextSelectedNodeIds).toEqual([source.id])
    expect(result.nodeCollectionChanged).toBe(true)
    expect(result.edgeCollectionChanged).toBe(true)
  })

  it("builds node types from definition.component instead of override maps", () => {
    const nodeTypes = buildNodeTypes(Object.values(nodeRegistry))

    expect(nodeTypes.setVariable).toBe(nodeRegistry.setVariable.component)
    expect(nodeTypes.inlineExpression).toBe(nodeRegistry.inlineExpression.component)
    expect(nodeTypes.extractor).toBe(nodeRegistry.extractor.component)
    expect(nodeTypes.branch).toBe(nodeRegistry.branch.component)
    expect(nodeTypes.result).toBe(nodeRegistry.result.component)
  })
})
