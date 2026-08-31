// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { CircleIcon } from "lucide-react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { NodePalette } from "../components/node-palette/node-palette"
import { WorkflowStoreProvider } from "../store"
import { builtinDefinitions } from "./builtin-definitions"
import { defineNode } from "./define-node"
import { normalizeNodeConfig } from "./node-config-normalization"
import { createWorkflowNode } from "./node-factory"
import { getAllowedTargets, getNodeOutputPaths } from "./node-graph-rules"
import {
  createNodeRegistry,
  getNodeDefinition,
  isNodeKind,
  listNodeDefinitions,
  registerNodeDefinitions,
  resetNodeDefinitions,
  workflowNodeKinds,
} from "./registry"

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

describe("the empty baseline", () => {
  afterEach(() => {
    resetNodeDefinitions()
  })

  it("registers nothing until a consumer asks for it", () => {
    // Arrange & Act — the setup file registers the built-ins for every other
    // suite in this package; this one starts from the state a freshly imported
    // package is actually in.
    resetNodeDefinitions()

    // Assert
    expect(workflowNodeKinds()).toEqual([])
    expect(getNodeDefinition("inlineExpression")).toBeUndefined()
  })

  it("offers the built-ins as an explicit opt-in", () => {
    // Arrange
    resetNodeDefinitions()

    // Act
    registerNodeDefinitions(builtinDefinitions)

    // Assert
    expect(workflowNodeKinds()).toEqual(
      builtinDefinitions.map((definition) => definition.kind)
    )
  })

  it("takes a subset, leaving the rest out of the vocabulary", () => {
    // Arrange
    resetNodeDefinitions()
    const [evaluator] = builtinDefinitions

    // Act
    registerNodeDefinitions(evaluator ? [evaluator] : [])

    // Assert
    expect(workflowNodeKinds()).toEqual(["evaluator"])
    expect(getNodeDefinition("extractor")).toBeUndefined()
  })
})

describe("consumer node registration", () => {
  beforeEach(() => {
    registerNodeDefinitions(builtinDefinitions)
  })

  afterEach(() => {
    cleanup()
    resetNodeDefinitions()
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
    const node = createWorkflowNode(createNodeRegistry([aiTurn]), "ai.turn", {
      x: 0,
      y: 0,
    })

    // Assert
    expect(node.type).toBe("ai.turn")
    expect(node.data).toMatchObject({ kind: "ai.turn", label: "AI turn" })
    expect(node.data.config).toEqual({ prompt: "" })
  })

  it("normalizes a registered kind's config against its declared keys", () => {
    // Arrange
    registerNodeDefinitions([aiTurn])

    // Act
    const config = normalizeNodeConfig(
      createNodeRegistry([aiTurn]),
      "ai.turn",
      {
        prompt: "Summarize",
        unknown: "dropped",
      }
    )

    // Assert
    expect(config).toEqual({ prompt: "Summarize" })
  })

  it("reads connection rules off the registered definition", () => {
    // Arrange
    registerNodeDefinitions([aiTurn])

    // Act & Assert
    const registry = createNodeRegistry([aiTurn])
    expect(getAllowedTargets(registry, "ai.turn")).toEqual([
      "ai.turn",
      "result",
    ])
    expect(getNodeOutputPaths(registry, "ai.turn")).toEqual(["content"])
  })

  it("treats an unregistered kind as connecting to nothing", () => {
    // A stored graph may carry a kind the consumer has not registered — that
    // must not throw while the canvas renders it.
    const registry = createNodeRegistry([aiTurn])
    expect(getAllowedTargets(registry, "never.registered")).toEqual([])
    expect(getNodeOutputPaths(registry, "never.registered")).toEqual([])
    expect(isNodeKind("never.registered")).toBe(false)
  })

  it("shows the registered kind in the palette", () => {
    // Arrange — the palette reads its own editor's store, not the module
    // singleton, so its provider carries the same vocabulary under test.
    registerNodeDefinitions([aiTurn])

    // Act
    render(
      <WorkflowStoreProvider definitions={[...builtinDefinitions, aiTurn]}>
        <NodePalette onAddNode={vi.fn()} />
      </WorkflowStoreProvider>
    )

    // Assert
    expect(screen.getByText("AI turn")).toBeInstanceOf(HTMLElement)
  })

  it("empties the vocabulary on reset", () => {
    // Arrange
    registerNodeDefinitions([aiTurn])

    // Act
    resetNodeDefinitions()

    // Assert — reset goes back to the package baseline, which is nothing at
    // all. The built-ins are a consumer registration like any other now.
    expect(workflowNodeKinds()).toEqual([])
    expect(getNodeDefinition("ai.turn")).toBeUndefined()
    expect(getNodeDefinition("evaluator")).toBeUndefined()
  })
})

describe("consumer view registration", () => {
  beforeEach(() => {
    registerNodeDefinitions(builtinDefinitions)
  })

  afterEach(() => {
    cleanup()
    resetNodeDefinitions()
  })

  it("registers a bespoke renderer for a kind via its definition", () => {
    // Arrange
    function AiTurnNode() {
      return <div />
    }
    const aiTurnWithView = defineNode({ ...aiTurn, view: AiTurnNode })

    // Act
    registerNodeDefinitions([aiTurnWithView])

    // Assert
    expect(getNodeDefinition("ai.turn")?.view).toBe(AiTurnNode)
  })

  it("leaves a kind without a view to the generic renderer", () => {
    // Arrange & Act
    registerNodeDefinitions([aiTurn])

    // Assert: no `view` means `buildNodeTypes` falls back to DefaultNodeRenderer.
    expect(getNodeDefinition("ai.turn")?.view).toBeUndefined()
  })
})
