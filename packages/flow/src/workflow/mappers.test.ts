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
    expect(restored.nodes[0]?.data.kind).toBe(
      initialWorkflowGraph.nodes[0]?.data.kind
    )
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

  it("rejects legacy payload containing trigger node kind", () => {
    const legacyPayload = {
      id: "wf-legacy",
      name: "Legacy",
      version: 1,
      metadata: {},
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        {
          id: "node-1",
          kind: "trigger",
          position: { x: 0, y: 0 },
          label: "Trigger",
          config: { eventName: "legacy-event" },
        },
      ],
      connections: [],
    }

    const parsed = parseInternalGraphJson(JSON.stringify(legacyPayload))
    expect(parsed.success).toBe(false)
    expect(parsed.error).toContain("valid id, kind, position, and label")
  })

  it("rejects legacy payload containing branch node kind", () => {
    const legacyPayload = {
      id: "wf-legacy-branch",
      name: "Legacy Branch",
      version: 1,
      metadata: {},
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        {
          id: "node-1",
          kind: "branch",
          position: { x: 0, y: 0 },
          label: "Branch",
          config: {
            conditions: [
              {
                id: "condition-1",
                value: "{{ score }}",
                operator: "is equal to",
                targetValue: "100",
              },
            ],
            logicalOperator: "and",
          },
        },
      ],
      connections: [],
    }

    const parsed = parseInternalGraphJson(JSON.stringify(legacyPayload))
    expect(parsed.success).toBe(false)
    expect(parsed.error).toContain("valid id, kind, position, and label")
  })

  it("exports domain json", () => {
    const triggerNode = createWorkflowNode("inlineExpression", { x: 0, y: 80 })
    triggerNode.data.config.isRoot = true
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
          data: {
            sourceKind: "inlineExpression" as const,
            targetKind: "inlineExpression" as const,
          },
        },
      ],
    }
    const payload = exportDomainJson(graphWithEdge)
    const parsed = JSON.parse(payload) as DomainWorkflowDTO

    expect(parsed.nodes.length).toBeGreaterThan(0)
    expect(parsed.connections.length).toBeGreaterThan(0)
    expect(parsed.version).toBe(initialWorkflowGraph.document.version)
  })

  it("treats routed edge data as transient presentation state during domain export", () => {
    const triggerNode = createWorkflowNode("inlineExpression", { x: 0, y: 80 })
    triggerNode.data.config.isRoot = true
    const inlineNode = createWorkflowNode("inlineExpression", { x: 360, y: 80 })
    const graphWithRoutedEdge = {
      ...initialWorkflowGraph,
      nodes: [triggerNode, inlineNode],
      edges: [
        {
          id: `${triggerNode.id}-${inlineNode.id}`,
          source: triggerNode.id,
          target: inlineNode.id,
          sourceHandle: null,
          targetHandle: null,
          data: {
            sourceKind: "inlineExpression" as const,
            targetKind: "inlineExpression" as const,
            route: {
              points: [
                { x: 260, y: 120 },
                { x: 320, y: 120 },
                { x: 360, y: 120 },
              ],
            },
          },
        },
      ],
    }

    const domain = internalToDomain(graphWithRoutedEdge)
    const restored = domainToInternal(domain)

    const sourceEdge = graphWithRoutedEdge.edges[0]
    if (!sourceEdge) {
      throw new Error("routed mapper edge fixture is missing")
    }

    expect(domain.connections[0]).toEqual({
      id: sourceEdge.id,
      sourceNodeId: triggerNode.id,
      targetNodeId: inlineNode.id,
      sourceHandle: null,
      targetHandle: null,
    })
    expect(restored.edges[0]?.data?.route).toBeUndefined()
  })

  it("normalizes select fields to defaults when import values are invalid", () => {
    const extractorNode = createWorkflowNode("extractor", { x: 360, y: 80 })
    const graph = {
      ...initialWorkflowGraph,
      nodes: [...initialWorkflowGraph.nodes, extractorNode],
    }
    const domain = internalToDomain(graph)
    const domainExtractor = domain.nodes.find(
      (node) => node.kind === "extractor"
    )
    if (!domainExtractor) {
      throw new Error("extractor node fixture is missing")
    }

    // tokenNumber is a number field; setting to a non-number should not crash
    domainExtractor.config.tokenNumber = "not-a-number"
    const restored = parseInternalGraphJson(JSON.stringify(domain))

    expect(restored.success).toBe(false)
    expect(restored.error).toContain("invalid value")
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
    const inlineNode = createWorkflowNode(
      "inlineExpression",
      { x: 500, y: 180 },
      "Inline Expr"
    )
    inlineNode.data.config.template = ["{{ $input.item.json.hostname }}"]
    const graph = {
      ...initialWorkflowGraph,
      nodes: [...initialWorkflowGraph.nodes, inlineNode],
    }

    const exported = internalToDomain(graph)
    const restored = domainToInternal(exported)
    const restoredInlineNode = restored.nodes.find(
      (node) => node.id === inlineNode.id
    )

    expect(restoredInlineNode?.data.kind).toBe("inlineExpression")
    expect(restoredInlineNode?.data.config.template).toEqual([
      "{{ $input.item.json.hostname }}",
    ])
  })

  it("normalizes legacy scalar inline expression templates during import", () => {
    const domain = internalToDomain(initialWorkflowGraph)
    const inlineNode = domain.nodes.find(
      (node) => node.kind === "inlineExpression"
    )
    if (!inlineNode) {
      throw new Error("inline expression fixture is missing")
    }

    inlineNode.config.template = "{{ $input.item.json.hostname }}"
    const restored = domainToInternal(domain)
    const restoredInlineNode = restored.nodes.find(
      (node) => node.id === inlineNode.id
    )

    expect(restoredInlineNode?.data.config.template).toEqual([
      "{{ $input.item.json.hostname }}",
    ])
  })

  it("preserves setVariable and evaluator config semantics across domain roundtrip", () => {
    const setVariableNode = createWorkflowNode(
      "setVariable",
      { x: 300, y: 120 },
      "Setter"
    )
    setVariableNode.data.config.variableName = "customerName"
    setVariableNode.data.config.valueExpression = "{{ $json.customer.name }}"

    const evaluatorNode = createWorkflowNode(
      "evaluator",
      { x: 620, y: 120 },
      "Evaluator"
    )
    evaluatorNode.data.config.conditions = [
      {
        id: "cond-1",
        value: "{{ customerName }}",
        operator: "is equal to",
        targetValue: "Alice",
      },
    ]
    evaluatorNode.data.config.logicalOperator = "or"

    const graph = {
      ...initialWorkflowGraph,
      nodes: [...initialWorkflowGraph.nodes, setVariableNode, evaluatorNode],
    }

    const raw = exportDomainJson(graph)
    const parsed = parseInternalGraphJson(raw)

    expect(parsed.success).toBe(true)
    const restoredSetVariable = parsed.value?.nodes.find(
      (node) => node.id === setVariableNode.id
    )
    const restoredEvaluator = parsed.value?.nodes.find(
      (node) => node.id === evaluatorNode.id
    )

    expect(restoredSetVariable?.data.config).toEqual(
      setVariableNode.data.config
    )
    expect(restoredEvaluator?.data.config).toEqual(evaluatorNode.data.config)
  })

  it("exports and parses selection clipboard json with relative positions", () => {
    const inlineNode = createWorkflowNode("inlineExpression", { x: 360, y: 80 })
    const graphWithTwo = {
      ...initialWorkflowGraph,
      nodes: [...initialWorkflowGraph.nodes, inlineNode],
    }
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

  it("rejects clipboard payload with schema-invalid config", () => {
    const node = internalToDomain(initialWorkflowGraph).nodes[0]
    if (!node) {
      throw new Error("fixture node not found")
    }

    const payload = JSON.stringify({
      kind: "workflow-selection-v1",
      nodes: [
        {
          ...node,
          kind: "result",
          config: { category: "maybe" },
        },
      ],
      connections: [],
    })

    const parsed = parseSelectionClipboardJson(payload)

    expect(parsed.success).toBe(false)
    expect(parsed.error).toContain("invalid value")
  })

  it("rejects clipboard payload containing branch node kind", () => {
    const node = internalToDomain(initialWorkflowGraph).nodes[0]
    if (!node) {
      throw new Error("fixture node not found")
    }

    const payload = JSON.stringify({
      kind: "workflow-selection-v1",
      nodes: [
        {
          ...node,
          kind: "branch",
          label: "Branch",
        },
      ],
      connections: [],
    })

    const parsed = parseSelectionClipboardJson(payload)

    expect(parsed.success).toBe(false)
    expect(parsed.error).toContain("valid id, kind, position, and label")
  })
})
