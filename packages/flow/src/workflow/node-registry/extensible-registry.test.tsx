// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { CircleIcon } from "lucide-react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { NodePalette } from "../components/node-palette/node-palette"
import { defineNode } from "./define-node"
import { normalizeNodeConfig } from "./node-config-normalization"
import { createWorkflowNode } from "./node-factory"
import { getAllowedTargets, getNodeOutputPaths } from "./node-graph-rules"
import {
  getNodeDefinition,
  isNodeKind,
  listNodeDefinitions,
  registerNodeDefinitions,
  resetNodeDefinitions,
  workflowNodeKinds,
} from "./registry"
import {
  listNodeViews,
  registerNodeViews,
  resetNodeViews,
} from "./view-registry"

/** A consumer-defined kind, in the dotted style a product vocabulary uses. */
const aiTurn = defineNode({
  kind: "ai.turn",
  title: "AI turn",
  description: "Let the agent take a turn.",
  icon: CircleIcon,
  category: "logic",
  fields: [{ key: "prompt", label: "Prompt", type: "textarea" }],
  buildDefaultConfig: () => ({ prompt: "" }),
  outputPaths: ["content"],
  allowedTargets: ["ai.turn", "result"],
})

describe("consumer node registration", () => {
  afterEach(() => {
    cleanup()
    resetNodeDefinitions()
    resetNodeViews()
  })

  it("adds the kind to the vocabulary", () => {
    // Arrange & Act
    registerNodeDefinitions([aiTurn])

    // Assert
    expect(workflowNodeKinds()).toContain("ai.turn")
    expect(isNodeKind("ai.turn")).toBe(true)
    expect(getNodeDefinition("ai.turn")).toBe(aiTurn)
  })

  it("keeps the built-ins and appends consumer kinds after them", () => {
    // Arrange
    const before = workflowNodeKinds()

    // Act
    registerNodeDefinitions([aiTurn])

    // Assert
    expect(workflowNodeKinds()).toEqual([...before, "ai.turn"])
  })

  it("replaces a kind registered twice instead of duplicating it", () => {
    // Arrange
    const revised = defineNode({ ...aiTurn, title: "AI turn (revised)" })

    // Act
    registerNodeDefinitions([aiTurn])
    registerNodeDefinitions([revised])

    // Assert
    const matches = listNodeDefinitions().filter(
      (definition) => definition.kind === "ai.turn"
    )
    expect(matches).toHaveLength(1)
    expect(matches[0]?.title).toBe("AI turn (revised)")
  })

  it("builds a node of a registered kind from its default config", () => {
    // Arrange
    registerNodeDefinitions([aiTurn])

    // Act
    const node = createWorkflowNode("ai.turn", { x: 0, y: 0 })

    // Assert
    expect(node.type).toBe("ai.turn")
    expect(node.data).toMatchObject({ kind: "ai.turn", label: "AI turn" })
    expect(node.data.config).toEqual({ prompt: "" })
  })

  it("normalizes a registered kind's config against its declared keys", () => {
    // Arrange
    registerNodeDefinitions([aiTurn])

    // Act
    const config = normalizeNodeConfig("ai.turn", {
      prompt: "Summarize",
      unknown: "dropped",
    })

    // Assert
    expect(config).toEqual({ prompt: "Summarize" })
  })

  it("reads connection rules off the registered definition", () => {
    // Arrange
    registerNodeDefinitions([aiTurn])

    // Act & Assert
    expect(getAllowedTargets("ai.turn")).toEqual(["ai.turn", "result"])
    expect(getNodeOutputPaths("ai.turn")).toEqual(["content"])
  })

  it("treats an unregistered kind as connecting to nothing", () => {
    // A stored graph may carry a kind the consumer has not registered — that
    // must not throw while the canvas renders it.
    expect(getAllowedTargets("never.registered")).toEqual([])
    expect(getNodeOutputPaths("never.registered")).toEqual([])
    expect(isNodeKind("never.registered")).toBe(false)
  })

  it("shows the registered kind in the palette", () => {
    // Arrange
    registerNodeDefinitions([aiTurn])

    // Act
    render(<NodePalette onAddNode={vi.fn()} />)

    // Assert
    expect(screen.getByText("AI turn")).toBeInstanceOf(HTMLElement)
  })

  it("restores the built-in vocabulary on reset", () => {
    // Arrange
    const builtinKinds = workflowNodeKinds()
    registerNodeDefinitions([aiTurn])

    // Act
    resetNodeDefinitions()

    // Assert
    expect(workflowNodeKinds()).toEqual(builtinKinds)
    expect(getNodeDefinition("ai.turn")).toBeUndefined()
  })
})

describe("consumer view registration", () => {
  afterEach(() => {
    cleanup()
    resetNodeDefinitions()
    resetNodeViews()
  })

  it("registers a bespoke renderer for a kind", () => {
    // Arrange
    function AiTurnNode() {
      return <div />
    }

    // Act
    registerNodeViews({ "ai.turn": AiTurnNode })

    // Assert
    expect(listNodeViews()["ai.turn"]).toBe(AiTurnNode)
  })

  it("leaves a kind without a view to the generic renderer", () => {
    // Arrange & Act
    registerNodeDefinitions([aiTurn])

    // Assert: no entry means `buildNodeTypes` falls back to DefaultNodeRenderer.
    expect(listNodeViews()["ai.turn"]).toBeUndefined()
  })
})
