import { describe, expect, it } from "vitest"

import { initialWorkflowGraph } from "./default-graph"
import {
  domainToInternal,
  exportDomainJson,
  internalToDomain,
  parseInternalGraphJson,
} from "./mappers"
import type { DomainWorkflowDTO } from "./types"

describe("workflow mappers", () => {
  it("maps internal graph to domain dto", () => {
    const domain = internalToDomain(initialWorkflowGraph, "wf-1", "Workflow")

    expect(domain.id).toBe("wf-1")
    expect(domain.name).toBe("Workflow")
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

  it("parses internal graph json", () => {
    const rawJson = JSON.stringify(initialWorkflowGraph)
    const parsed = parseInternalGraphJson(rawJson)

    expect(parsed.success).toBe(true)
    expect(parsed.value?.nodes.length).toBe(initialWorkflowGraph.nodes.length)
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
    expect(parsed.error).toContain("nodes")
  })

  it("exports domain json", () => {
    const payload = exportDomainJson(initialWorkflowGraph)
    const parsed = JSON.parse(payload) as DomainWorkflowDTO

    expect(parsed.nodes.length).toBeGreaterThan(0)
    expect(parsed.connections.length).toBeGreaterThan(0)
  })

  it("normalizes expression-like fields to defaults when import types are invalid", () => {
    const domain = internalToDomain(initialWorkflowGraph)
    const transformNode = domain.nodes.find((node) => node.kind === "transform")
    if (!transformNode) {
      throw new Error("transform node fixture is missing")
    }

    transformNode.config.expression = 42
    const restored = domainToInternal(domain)
    const restoredTransform = restored.nodes.find((node) => node.data.kind === "transform")

    expect(restoredTransform?.data.config.expression).toBe("return input")
  })
})
