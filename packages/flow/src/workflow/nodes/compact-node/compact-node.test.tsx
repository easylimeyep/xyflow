// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { buildNodeTypes } from "../../node-registry/node-types-builder"
import { createNodeRegistry } from "../../node-registry/registry"
import { WorkflowStoreProvider } from "../../store"
import type { WorkflowNode } from "../../types"
import { LARGE_GRAPH_MIN_NODES } from "../../large-graph"
import { COMPACT_NODE_MAX_ZOOM } from "./compact-node"

interface FakeInternalNode {
  measured: { width?: number; height?: number }
  internals: { positionAbsolute: { x: number; y: number } }
}

interface FakeFlowState {
  transform: [number, number, number]
  /** The pane's size; 0 until React Flow has measured it. */
  width: number
  height: number
  nodeLookup: Map<string, FakeInternalNode>
}

const flowState: FakeFlowState = {
  transform: [0, 0, 1],
  width: 0,
  height: 0,
  nodeLookup: new Map(),
}

function placeNode(
  id: string,
  position: { x: number; y: number },
  measured: FakeInternalNode["measured"] = {}
) {
  flowState.nodeLookup.set(id, {
    measured,
    internals: { positionAbsolute: position },
  })
}

vi.mock("@xyflow/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@xyflow/react")>()),
  Handle: ({ type, id }: { type: string; id?: string }) => (
    <span data-testid={`handle-${type}`} data-handle-id={id ?? ""} />
  ),
  useStore: (selector: (state: FakeFlowState) => unknown) =>
    selector(flowState),
}))

vi.mock("../node-context-menu/node-context-menu", () => ({
  NodeContextMenu: ({
    children: View,
    ...props
  }: NodeProps & { children: (props: NodeProps) => ReactNode }) => (
    <div data-testid="full-node">
      <input aria-label="field" />
      <View {...props} />
    </div>
  ),
}))

const registry = createNodeRegistry(builtinBaseDefinitions)
const nodeTypes = buildNodeTypes(builtinBaseDefinitions)

function nodeProps(node: WorkflowNode, selected = false): NodeProps {
  return {
    id: node.id,
    type: node.data.kind,
    data: node.data,
    selected,
    dragging: false,
    zIndex: 1,
    selectable: true,
    deletable: true,
    draggable: true,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  }
}

/** Workflow nodes the store holds beside the rendered one. */
let fillerNodes: WorkflowNode[] = []

function renderNode(node: WorkflowNode, selected = false) {
  const View = nodeTypes[node.data.kind]!
  return render(
    <WorkflowStoreProvider
      definitions={builtinBaseDefinitions}
      initialGraph={{
        nodes: [node, ...fillerNodes],
        edges: [],
        groups: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        document: { id: "doc", name: "Doc", version: 1, metadata: {} },
      }}
    >
      <View {...nodeProps(node, selected)} />
    </WorkflowStoreProvider>
  )
}

/**
 * Fills the workflow past the large-graph threshold with nodes at the origin,
 * and React Flow's lookup with them.
 */
function makeGraphLarge() {
  fillerNodes = Array.from({ length: LARGE_GRAPH_MIN_NODES }, (_, index) => ({
    ...createWorkflowNode(registry, "result", { x: 0, y: 0 }),
    id: `filler-${index}`,
  }))
  fillerNodes.forEach((filler) => placeNode(filler.id, { x: 0, y: 0 }))
}

function zoomTo(zoom: number) {
  flowState.transform = [0, 0, zoom]
}

describe("compact nodes at low zoom", () => {
  beforeEach(() => {
    zoomTo(1)
    flowState.width = 0
    flowState.height = 0
    flowState.nodeLookup = new Map()
    fillerNodes = []
  })

  afterEach(() => {
    cleanup()
  })

  it("renders the full node view at a readable zoom", () => {
    const node = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    renderNode(node)

    expect(screen.getByTestId("full-node")).toBeTruthy()
    expect(screen.queryByTestId("workflow-node-compact")).toBeNull()
  })

  it("swaps in a title-only card below the compact zoom", () => {
    const node = createWorkflowNode(
      registry,
      "setVariable",
      { x: 0, y: 0 },
      "Calc price"
    )
    zoomTo(COMPACT_NODE_MAX_ZOOM - 0.05)
    renderNode(node)

    const card = screen.getByTestId("workflow-node-compact")
    expect(card.textContent).toBe("Calc price")
    expect(card.dataset.nodeId).toBe(node.id)
    expect(screen.queryByTestId("full-node")).toBeNull()
  })

  it("keeps the size the full node was measured at", () => {
    const node = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    placeNode(node.id, { x: 0, y: 0 }, { width: 260, height: 412 })
    zoomTo(0.2)
    renderNode(node)

    const card = screen.getByTestId("workflow-node-compact")
    expect(card.style.width).toBe("260px")
    expect(card.style.height).toBe("412px")
  })

  it("falls back to the layout estimate before the node was measured", () => {
    const node = createWorkflowNode(registry, "extractor", { x: 0, y: 0 })
    zoomTo(0.2)
    renderNode(node)

    const card = screen.getByTestId("workflow-node-compact")
    expect(card.style.width).toBe("260px")
    expect(card.style.height).toBe("195px")
  })

  it("draws the same handles edges attach to", () => {
    const evaluator = createWorkflowNode(registry, "evaluator", { x: 0, y: 0 })
    zoomTo(0.2)
    renderNode(evaluator)

    expect(screen.getAllByTestId("handle-target")).toHaveLength(1)
    expect(
      screen
        .getAllByTestId("handle-source")
        .map((handle) => handle.dataset.handleId)
    ).toEqual(["evaluator-true", "evaluator-false"])
  })

  it("leaves out the target handle on a root and the outputs on a result", () => {
    const root = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    root.data.config.isRoot = true
    const result = createWorkflowNode(registry, "result", { x: 0, y: 0 })
    zoomTo(0.2)

    renderNode(root)
    expect(screen.queryByTestId("handle-target")).toBeNull()
    cleanup()

    renderNode(result)
    expect(screen.queryByTestId("handle-source")).toBeNull()
  })

  it("marks a selected node", () => {
    const node = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    zoomTo(0.2)
    renderNode(node, true)

    expect(screen.getByTestId("workflow-node-compact").dataset.selected).toBe(
      "true"
    )
  })

  it("keeps the full view of a node being edited until focus leaves it", () => {
    const node = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    const { rerender } = renderNode(node)
    const View = nodeTypes[node.data.kind]!
    const rerenderNode = () =>
      rerender(
        <WorkflowStoreProvider
          definitions={builtinBaseDefinitions}
          initialGraph={{
            nodes: [node],
            edges: [],
            groups: [],
            viewport: { x: 0, y: 0, zoom: 1 },
            document: { id: "doc", name: "Doc", version: 1, metadata: {} },
          }}
        >
          <View {...nodeProps(node)} />
        </WorkflowStoreProvider>
      )

    act(() => {
      screen.getByLabelText("field").focus()
    })
    zoomTo(0.2)
    rerenderNode()
    expect(screen.getByTestId("full-node")).toBeTruthy()

    act(() => {
      screen.getByLabelText("field").blur()
    })
    expect(screen.getByTestId("workflow-node-compact")).toBeTruthy()
  })

  it("renders a node far outside the viewport compact at a readable zoom", () => {
    const node = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    flowState.width = 1000
    flowState.height = 800
    makeGraphLarge()
    placeNode(node.id, { x: 5000, y: 5000 })
    renderNode(node)

    expect(screen.getByTestId("workflow-node-compact")).toBeTruthy()
  })

  it("does not count group frames toward the large-graph threshold", () => {
    const node = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    flowState.width = 1000
    flowState.height = 800
    for (let index = 0; index < LARGE_GRAPH_MIN_NODES; index += 1) {
      placeNode(`group-frame:g${index}`, { x: 0, y: 0 })
    }
    placeNode(node.id, { x: 5000, y: 5000 })
    renderNode(node)

    expect(screen.getByTestId("full-node")).toBeTruthy()
  })

  it("keeps a node far outside the viewport in full on a small graph", () => {
    const node = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    flowState.width = 1000
    flowState.height = 800
    placeNode(node.id, { x: 5000, y: 5000 })
    renderNode(node)

    expect(screen.getByTestId("full-node")).toBeTruthy()
  })

  it("renders a node near the viewport in full", () => {
    const node = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    flowState.width = 1000
    flowState.height = 800
    makeGraphLarge()
    // Just past the right edge: inside the margin kept around the viewport.
    placeNode(node.id, { x: 1100, y: 100 })
    renderNode(node)

    expect(screen.getByTestId("full-node")).toBeTruthy()
  })
})
