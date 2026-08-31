// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { CircleIcon } from "lucide-react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { NodePalette } from "../components/node-palette/node-palette"
import { WorkflowStoreProvider } from "../store"
import { builtinDefinitions } from "./builtin-definitions"
import { defineNode } from "./define-node"
import { normalizeNodeConfig } from "./node-config-normalization"
import { createWorkflowNode } from "./node-factory"
import { getAllowedTargets, getNodeOutputPaths } from "./node-graph-rules"
import { createNodeRegistry } from "./registry"

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

const builtinKinds = builtinDefinitions.map((definition) => definition.kind)

describe("the empty baseline", () => {
  afterEach(() => {
    cleanup()
  })

  it("gives an editor no kinds at all until it is handed some", () => {
    // Arrange & Act — a store built without `definitions` is the state a
    // freshly imported package puts an editor in. Nothing seeds a default
    // vocabulary on its behalf (ADR-0005).
    render(
      <WorkflowStoreProvider>
        <NodePalette onAddNode={vi.fn()} />
      </WorkflowStoreProvider>
    )

    // Assert
    for (const definition of builtinDefinitions) {
      expect(screen.queryByText(definition.title)).toBeNull()
    }
  })

  it("offers the built-ins as an explicit opt-in", () => {
    // Arrange & Act
    const registry = createNodeRegistry(builtinDefinitions)

    // Assert
    expect(registry.kinds()).toEqual(builtinKinds)
  })

  it("takes a subset, leaving the rest out of the vocabulary", () => {
    // Arrange
    const [evaluator] = builtinDefinitions

    // Act
    const registry = createNodeRegistry(evaluator ? [evaluator] : [])

    // Assert
    expect(registry.kinds()).toEqual(["evaluator"])
    expect(registry.get("extractor")).toBeUndefined()
  })
})

describe("consumer node registration", () => {
  afterEach(() => {
    cleanup()
  })

  it("adds the kind to the vocabulary", () => {
    // Arrange & Act
    const registry = createNodeRegistry([...builtinDefinitions, aiTurn])

    // Assert
    expect(registry.kinds()).toContain("ai.turn")
    expect(registry.has("ai.turn")).toBe(true)
    expect(registry.get("ai.turn")).toBe(aiTurn)
  })

  it("keeps the built-ins and appends consumer kinds after them", () => {
    // Arrange & Act
    const registry = createNodeRegistry([...builtinDefinitions, aiTurn])

    // Assert
    expect(registry.kinds()).toEqual([...builtinKinds, "ai.turn"])
  })

  it("replaces a kind declared twice instead of duplicating it", () => {
    // Arrange — the shape a host composing a base set with its own override
    // hands over.
    const revised = defineNode({ ...aiTurn, title: "AI turn (revised)" })

    // Act
    const registry = createNodeRegistry([aiTurn, revised])

    // Assert
    const matches = registry
      .list()
      .filter((definition) => definition.kind === "ai.turn")
    expect(matches).toHaveLength(1)
    expect(matches[0]?.title).toBe("AI turn (revised)")
  })

  it("builds a node of a registered kind from its default config", () => {
    // Arrange & Act
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
    // Arrange & Act
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
    const registry = createNodeRegistry([aiTurn])

    // Act & Assert
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
    expect(registry.has("never.registered")).toBe(false)
  })

  it("shows the registered kind in the palette", () => {
    // Arrange & Act — the palette reads its own editor's store, so the
    // vocabulary under test is the one that editor was handed.
    render(
      <WorkflowStoreProvider definitions={[...builtinDefinitions, aiTurn]}>
        <NodePalette onAddNode={vi.fn()} />
      </WorkflowStoreProvider>
    )

    // Assert
    expect(screen.getByText("AI turn")).toBeInstanceOf(HTMLElement)
  })

  it("leaves a second editor's vocabulary alone", () => {
    // Two editors on one page disagree about what exists without fighting:
    // there is no shared mutable vocabulary left for one to overwrite.
    const withConsumerKind = createNodeRegistry([...builtinDefinitions, aiTurn])
    const builtinsOnly = createNodeRegistry(builtinDefinitions)

    expect(withConsumerKind.has("ai.turn")).toBe(true)
    expect(builtinsOnly.has("ai.turn")).toBe(false)
    expect(builtinsOnly.kinds()).toEqual(builtinKinds)
  })
})

describe("consumer view registration", () => {
  afterEach(() => {
    cleanup()
  })

  it("registers a bespoke renderer for a kind via its definition", () => {
    // Arrange
    function AiTurnNode() {
      return <div />
    }
    const aiTurnWithView = defineNode({ ...aiTurn, view: AiTurnNode })

    // Act
    const registry = createNodeRegistry([aiTurnWithView])

    // Assert
    expect(registry.get("ai.turn")?.view).toBe(AiTurnNode)
  })

  it("leaves a kind without a view to the generic renderer", () => {
    // Arrange & Act
    const registry = createNodeRegistry([aiTurn])

    // Assert: no `view` means `buildNodeTypes` falls back to DefaultNodeRenderer.
    expect(registry.get("ai.turn")?.view).toBeUndefined()
  })
})
