import { CircleIcon } from "lucide-react"
import { describe, expect, it } from "vitest"

import { applyUpdateNodeConfigCommand } from "../graph-engine"
import type { WorkflowGraphState } from "../types/types"
import { defineNode, getNodeConfigKeys } from "./define-node"
import {
  decodeNodeConfig,
  normalizeNodeConfig,
} from "./node-config-normalization"
import { createWorkflowNode } from "./node-factory"
import { createNodeRegistry } from "./registry"

/**
 * A consumer kind whose optional `maxSteps` is declared as a field but left out
 * of the default config: the schema it derives from constrains the number, so
 * seeding a zero would make a freshly dropped node invalid on a field nobody
 * touched.
 */
const aiTurn = defineNode({
  kind: "ai.turn",
  title: "AI turn",
  description: "Let the agent take a turn.",
  icon: CircleIcon,
  category: "logic",
  fields: [
    { key: "prompt", label: "Prompt", type: "textarea" },
    { key: "maxSteps", label: "Max steps", type: "number" },
  ],
  buildDefaultConfig: () => ({ prompt: "" }),
  outputPaths: ["content"],
  allowedTargets: ["ai.turn"],
  validateConfigValue: (key, value) =>
    key === "prompt"
      ? typeof value === "string"
      : typeof value === "number" && value > 0,
})

/** The vocabulary these cases run against: the consumer kind, and only it. */
const registry = createNodeRegistry([aiTurn])

function graphWithTurnNode(): WorkflowGraphState {
  const node = createWorkflowNode(registry, "ai.turn", { x: 0, y: 0 }, "Turn")
  return {
    nodes: [node],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    document: { id: "doc", name: "Doc", version: 1, metadata: {} },
  }
}

describe("declared config surface", () => {
  it("unions field keys with default config keys, without duplicates", () => {
    // Arrange & Act
    const keys = getNodeConfigKeys(aiTurn)

    // Assert
    expect(keys).toEqual(["prompt", "maxSteps"])
  })

  it("accepts an update for a declared key the default config omits", () => {
    // Arrange
    const graph = graphWithTurnNode()
    const nodeId = graph.nodes[0]!.id

    // Act
    const result = applyUpdateNodeConfigCommand(registry, graph, {
      nodeId,
      update: { kind: "ai.turn", key: "maxSteps", value: 4 },
    })

    // Assert
    expect(result.ok).toBe(true)
    expect(result.ok && result.nextGraph.nodes[0]?.data.config).toEqual({
      prompt: "",
      maxSteps: 4,
    })
  })

  it("refuses an update for a key the definition does not declare", () => {
    // Arrange
    const graph = graphWithTurnNode()
    const nodeId = graph.nodes[0]!.id

    // Act
    const result = applyUpdateNodeConfigCommand(registry, graph, {
      nodeId,
      update: { kind: "ai.turn", key: "temperature", value: 1 },
    })

    // Assert
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe(
      "INVALID_NODE_CONFIG_KEY"
    )
  })

  it("keeps a declared unseeded key through normalization and drops an undeclared one", () => {
    // Act
    const config = normalizeNodeConfig(registry, "ai.turn", {
      prompt: "Summarize",
      maxSteps: 3,
      temperature: 1,
    })

    // Assert
    expect(config).toEqual({ prompt: "Summarize", maxSteps: 3 })
  })

  it("decodes a stored config carrying a declared unseeded key", () => {
    // Act
    const decoded = decodeNodeConfig(registry, "ai.turn", {
      prompt: "Summarize",
      maxSteps: 3,
    })

    // Assert
    expect(decoded).toEqual({
      success: true,
      config: { prompt: "Summarize", maxSteps: 3 },
    })
  })
})
