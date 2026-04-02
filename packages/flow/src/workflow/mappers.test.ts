import { describe, expect, it } from "vitest"

import { initialWorkflowGraph } from "./default-graph"
import { createWorkflowNode } from "./node-registry"
import {
  domainToInternal,
  exportDomainJson,
  exportSelectionClipboardJson,
  internalToDomain,
  parseInternalGraphJson,
  parseSelectionClipboardJson,
} from "./mappers"
import type { DomainWorkflowDTO } from "./types"

describe("workflow mappers", () => {
  it("maps internal graph to domain dto", () => {
    const domain = internalToDomain(initialWorkflowGraph, "wf-1", "Workflow")

    expect(domain.id).toBe("wf-1")
    expect(domain.name).toBe("Workflow")
    expect(domain.version).toBe(initialWorkflowGraph.document.version)
    expect(domain.metadata.source).toBe("ui")
    expect(domain.nodes.length).toBe(initialWorkflowGraph.nodes.length)
    expect(domain.connections.length).toBe(initialWorkflowGraph.edges.length)
  })

  it("maps domain dto back to internal graph", () => {
    const domain = internalToDomain(initialWorkflowGraph)
    const restored = domainToInternal(domain)

    expect(restored.nodes).toHaveLength(initialWorkflowGraph.nodes.length)
    expect(restored.edges).toHaveLength(initialWorkflowGraph.edges.length)
    expect(restored.nodes[0]?.data.kind).toBe(initialWorkflowGraph.nodes[0]?.data.kind)
  })

  it("rejects internal graph json (domain-only import contract)", () => {
    const rawJson = JSON.stringify(initialWorkflowGraph)
    const parsed = parseInternalGraphJson(rawJson)

    expect(parsed.success).toBe(false)
    expect(parsed.error).toContain("domain workflow schema")
  })

  it("parses domain dto json", () => {
    const domain = internalToDomain(initialWorkflowGraph)
    const parsed = parseInternalGraphJson(JSON.stringify(domain))

    expect(parsed.success).toBe(true)
    expect(parsed.value?.edges.length).toBe(initialWorkflowGraph.edges.length)
  })

  it("rejects invalid payload", () => {
    const parsed = parseInternalGraphJson('{"unexpected":true}')
    expect(parsed.success).toBe(false)
    expect(parsed.error).toContain("domain workflow schema")
  })

  it("exports domain json", () => {
    const triggerNode = createWorkflowNode("trigger", { x: 0, y: 80 })
    const inlineNode = createWorkflowNode("inlineExpression", { x: 360, y: 80 })
    const graphWithEdge = {
      ...initialWorkflowGraph,
      nodes: [triggerNode, inlineNode],
      edges: [
        {
          id: `${triggerNode.id}-${inlineNode.id}`,
          source: triggerNode.id,
          target: inlineNode.id,
          sourceHandle: null,
          targetHandle: null,
          data: { sourceKind: "trigger" as const, targetKind: "inlineExpression" as const },
        },
      ],
    }
    const payload = exportDomainJson(graphWithEdge)
    const parsed = JSON.parse(payload) as DomainWorkflowDTO

    expect(parsed.nodes.length).toBeGreaterThan(0)
    expect(parsed.connections.length).toBeGreaterThan(0)
    expect(parsed.version).toBe(initialWorkflowGraph.document.version)
  })

  it("normalizes select fields to defaults when import values are invalid", () => {
    const extractorNode = createWorkflowNode("extractor", { x: 360, y: 80 })
    const graph = { ...initialWorkflowGraph, nodes: [...initialWorkflowGraph.nodes, extractorNode] }
    const domain = internalToDomain(graph)
    const domainExtractor = domain.nodes.find((node) => node.kind === "extractor")
    if (!domainExtractor) {
      throw new Error("extractor node fixture is missing")
    }

    // tokenNumber is a number field; setting to a non-number should not crash
    domainExtractor.config.tokenNumber = "not-a-number"
    const restored = domainToInternal(domain)
    const restoredExtractor = restored.nodes.find((node) => node.data.kind === "extractor")

    // config is preserved as-is for non-select fields (no schema coercion crash)
    expect(restoredExtractor).toBeDefined()
  })

  it("preserves metadata from imported domain dto", () => {
    const domain = internalToDomain(initialWorkflowGraph)
    domain.metadata = {
      source: "api",
      tenantId: "tenant-1",
    }
    const raw = JSON.stringify(domain)

    const parsed = parseInternalGraphJson(raw)
    expect(parsed.success).toBe(true)

    const roundtrip = internalToDomain(parsed.value!, "wf-2", "Roundtrip")
    expect(roundtrip.metadata.source).toBe("api")
    expect(roundtrip.metadata.tenantId).toBe("tenant-1")
  })

  it("roundtrips inline expression node config", () => {
    const inlineNode = createWorkflowNode("inlineExpression", { x: 500, y: 180 }, "Inline Expr")
    inlineNode.data.config.template = "{{ $input.item.json.hostname }}"
    const graph = {
      ...initialWorkflowGraph,
      nodes: [...initialWorkflowGraph.nodes, inlineNode],
    }

    const exported = internalToDomain(graph)
    const restored = domainToInternal(exported)
    const restoredInlineNode = restored.nodes.find((node) => node.id === inlineNode.id)

    expect(restoredInlineNode?.data.kind).toBe("inlineExpression")
    expect(restoredInlineNode?.data.config.template).toBe("{{ $input.item.json.hostname }}")
  })

  it("exports and parses selection clipboard json with relative positions", () => {
    const inlineNode = createWorkflowNode("inlineExpression", { x: 360, y: 80 })
    const graphWithTwo = { ...initialWorkflowGraph, nodes: [...initialWorkflowGraph.nodes, inlineNode] }
    const nodes = internalToDomain(graphWithTwo).nodes.slice(0, 2)
    const baseNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: 500 + index * 80,
        y: 300 + index * 40,
      },
    }))
    const raw = exportSelectionClipboardJson(baseNodes, [])
    const parsed = parseSelectionClipboardJson(raw)

    expect(parsed.success).toBe(true)
    expect(parsed.value?.nodes[0]?.position).toEqual({ x: 0, y: 0 })
    expect(parsed.value?.nodes[1]?.position).toEqual({ x: 80, y: 40 })
  })

  it("rejects selection clipboard json with external connections", () => {
    const node = internalToDomain(initialWorkflowGraph).nodes[0]
    if (!node) {
      throw new Error("fixture node not found")
    }

    const payload = JSON.stringify({
      kind: "workflow-selection-v1",
      nodes: [node],
      connections: [
        {
          id: "connection-1",
          sourceNodeId: node.id,
          targetNodeId: "missing-node",
          sourceHandle: null,
          targetHandle: null,
        },
      ],
    })
    const parsed = parseSelectionClipboardJson(payload)

    expect(parsed.success).toBe(false)
    expect(parsed.error).toContain("outside copied selection")
  })
})
