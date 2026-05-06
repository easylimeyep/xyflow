// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { WorkflowEditor } from "./workflow-editor"

const paletteRenderSpy = vi.fn()
const canvasRenderSpy = vi.fn()

vi.mock("../editor-toolbar", () => ({
  EditorToolbar: ({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
  }: {
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
  }) => (
    <div>
      <span data-testid="toolbar-can-undo">{String(canUndo)}</span>
      <span data-testid="toolbar-can-redo">{String(canRedo)}</span>
      <button type="button" onClick={onUndo}>
        toolbar-undo
      </button>
      <button type="button" onClick={onRedo}>
        toolbar-redo
      </button>
    </div>
  ),
}))

vi.mock("../node-palette", () => ({
  NodePalette: ({
    onAddNode,
    quickAddActive,
    isOpen = true,
  }: {
    onAddNode: (kind: string) => void
    quickAddActive?: boolean
    isOpen?: boolean
  }) => {
    paletteRenderSpy()
    return (
      <div>
        <span data-testid="palette-quick-add-active">
          {String(Boolean(quickAddActive))}
        </span>
        <span data-testid="palette-open">{String(Boolean(isOpen))}</span>
        <button type="button" onClick={() => onAddNode("extractor")}>
          palette-add-node
        </button>
      </div>
    )
  },
}))

vi.mock("../workflow-canvas", () => ({
  WorkflowCanvas: ({
    nodes,
    autoLayoutOnInit,
    onMeasuredInitialAutoLayout,
    onNodesChange,
    onViewportChange,
    onPointerFlowPosition,
    onPaneClick,
    onSelectNodes,
  }: {
    nodes: Array<{ id: string }>
    autoLayoutOnInit?: "after-measure"
    onMeasuredInitialAutoLayout?: () => Promise<boolean>
    onNodesChange: (
      changes: Array<{
        id: string
        type: "dimensions"
        dimensions: { width: number; height: number }
        setAttributes: boolean
      }>
    ) => void
    onSelectNodes: (nodeIds: string[]) => void
    onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void
    onPointerFlowPosition: (position: { x: number; y: number }) => void
    onPaneClick: () => void
  }) => {
    canvasRenderSpy({ autoLayoutOnInit, onMeasuredInitialAutoLayout })
    return (
      <div>
        <span data-testid="canvas-node-count">{String(nodes.length)}</span>
        <span data-testid="canvas-auto-layout-on-init">
          {autoLayoutOnInit ?? "none"}
        </span>
        <span data-testid="canvas-has-measured-initial-layout">
          {String(typeof onMeasuredInitialAutoLayout === "function")}
        </span>
        <button
          type="button"
          onClick={() => onViewportChange({ x: 100, y: 50, zoom: 1.2 })}
        >
          canvas-update-viewport
        </button>
        <button
          type="button"
          onClick={() => onPointerFlowPosition({ x: 320, y: 240 })}
        >
          canvas-update-pointer
        </button>
        <button type="button" onClick={onPaneClick}>
          canvas-pane-click
        </button>
        <button type="button" onClick={() => onSelectNodes([nodes[0]?.id ?? ""])}>
          canvas-select-first-node
        </button>
        <button
          type="button"
          onClick={() => {
            const addedNode = nodes.find((node) => node.id !== nodes[0]?.id)
            if (!addedNode) return
            onNodesChange([
              {
                id: addedNode.id,
                type: "dimensions",
                dimensions: { width: 260, height: 195 },
                setAttributes: true,
              },
            ])
          }}
        >
          canvas-measure-added-node
        </button>
      </div>
    )
  },
}))

function QuickAddControls() {
  const startQuickAddFromOutput = WorkflowEditor.use.store(
    (state) => state.startQuickAddFromOutput
  )
  const nodes = WorkflowEditor.use.store((state) => state.history.present.nodes)

  return (
    <button
      type="button"
      onClick={() => {
        const triggerNode = nodes.find(
          (node) =>
            node.data.kind === "inlineExpression" &&
            node.data.config.isRoot === true
        )
        if (triggerNode) {
          startQuickAddFromOutput(triggerNode.id)
        }
      }}
    >
      test-start-quick-add
    </button>
  )
}

function HookProbe() {
  const graph = WorkflowEditor.use.graph()
  const selection = WorkflowEditor.use.selection()
  const actions = WorkflowEditor.use.actions()

  return (
    <div>
      <span data-testid="hook-graph-node-count">{graph.nodes.length}</span>
      <span data-testid="hook-selection-count">
        {selection.selectedNodeIds.length}
      </span>
      <span data-testid="hook-actions-has-export">
        {String(typeof actions.exportDomain === "function")}
      </span>
    </div>
  )
}

function renderCustomEditor(extraChildren?: ReactNode) {
  return render(
    <WorkflowEditor>
      {extraChildren}
      <WorkflowEditor.Toolbar />
      <WorkflowEditor.Body>
        <WorkflowEditor.Palette />
        <WorkflowEditor.Canvas />
        <WorkflowEditor.ConfigPanel />
      </WorkflowEditor.Body>
    </WorkflowEditor>
  )
}

describe("WorkflowEditor wiring", () => {
  afterEach(() => {
    cleanup()
    paletteRenderSpy.mockClear()
    canvasRenderSpy.mockClear()
  })

  it("renders the default composition without custom children", () => {
    render(<WorkflowEditor />)

    expect(screen.getByTestId("toolbar-can-undo")).toBeTruthy()
    expect(screen.getByTestId("palette-open").textContent).toBe("true")
    expect(screen.getByTestId("canvas-node-count")).toBeTruthy()
    expect(screen.getByTestId("canvas-auto-layout-on-init").textContent).toBe(
      "none"
    )
    expect(screen.getByText("Config Panel")).toBeTruthy()
  })

  it("passes measured initial auto-layout option to the default canvas", () => {
    render(<WorkflowEditor autoLayoutOnInit="after-measure" />)

    expect(screen.getByTestId("canvas-auto-layout-on-init").textContent).toBe(
      "after-measure"
    )
    expect(
      screen.getByTestId("canvas-has-measured-initial-layout").textContent
    ).toBe("true")
  })

  it("supports custom composition with compound parts", () => {
    renderCustomEditor(<div data-testid="custom-marker">custom-layout</div>)

    expect(screen.getByTestId("custom-marker")).toBeTruthy()
    expect(screen.getByTestId("toolbar-can-undo")).toBeTruthy()
    expect(screen.getByText("Config Panel")).toBeTruthy()
  })

  it("preserves measured initial auto-layout with custom composition", () => {
    render(
      <WorkflowEditor autoLayoutOnInit="after-measure">
        <WorkflowEditor.Body>
          <WorkflowEditor.Canvas />
        </WorkflowEditor.Body>
      </WorkflowEditor>
    )

    expect(screen.getByTestId("canvas-auto-layout-on-init").textContent).toBe(
      "after-measure"
    )
  })

  it("adds node from palette and reflects updated canvas node count", async () => {
    const user = userEvent.setup()
    render(<WorkflowEditor />)

    const beforeCount = Number(screen.getByTestId("canvas-node-count").textContent)
    await user.click(screen.getByRole("button", { name: "palette-add-node" }))
    const afterCount = Number(screen.getByTestId("canvas-node-count").textContent)

    expect(afterCount).toBe(beforeCount + 1)
    expect(screen.getByTestId("toolbar-can-undo").textContent).toBe("true")
  })

  it("removes palette-added node with one undo after measurement update", async () => {
    const user = userEvent.setup()
    render(<WorkflowEditor />)

    const beforeCount = Number(screen.getByTestId("canvas-node-count").textContent)
    await user.click(screen.getByRole("button", { name: "palette-add-node" }))
    await user.click(screen.getByRole("button", { name: "canvas-measure-added-node" }))
    expect(Number(screen.getByTestId("canvas-node-count").textContent)).toBe(
      beforeCount + 1
    )

    await user.click(screen.getByRole("button", { name: "toolbar-undo" }))
    expect(Number(screen.getByTestId("canvas-node-count").textContent)).toBe(beforeCount)
  })

  it("updates toolbar canUndo/canRedo across undo-redo history steps", async () => {
    const user = userEvent.setup()
    render(<WorkflowEditor />)

    expect(screen.getByTestId("toolbar-can-undo").textContent).toBe("false")
    expect(screen.getByTestId("toolbar-can-redo").textContent).toBe("false")

    await user.click(screen.getByRole("button", { name: "palette-add-node" }))
    expect(screen.getByTestId("toolbar-can-undo").textContent).toBe("true")
    expect(screen.getByTestId("toolbar-can-redo").textContent).toBe("false")

    await user.click(screen.getByRole("button", { name: "toolbar-undo" }))
    expect(screen.getByTestId("toolbar-can-undo").textContent).toBe("false")
    expect(screen.getByTestId("toolbar-can-redo").textContent).toBe("true")

    await user.click(screen.getByRole("button", { name: "toolbar-redo" }))
    expect(screen.getByTestId("toolbar-can-undo").textContent).toBe("true")
    expect(screen.getByTestId("toolbar-can-redo").textContent).toBe("false")
  })

  it("does not rerender palette on viewport-only updates", async () => {
    const user = userEvent.setup()
    render(<WorkflowEditor />)

    const baselinePaletteRenders = paletteRenderSpy.mock.calls.length
    const baselineCanvasRenders = canvasRenderSpy.mock.calls.length

    await user.click(screen.getByRole("button", { name: "canvas-update-viewport" }))
    await user.click(screen.getByRole("button", { name: "canvas-update-viewport" }))
    await user.click(screen.getByRole("button", { name: "canvas-update-viewport" }))

    expect(canvasRenderSpy.mock.calls.length).toBe(baselineCanvasRenders)
    expect(paletteRenderSpy.mock.calls.length).toBe(baselinePaletteRenders)
  })

  it("keeps non-canvas render budget stable on pointer updates", async () => {
    const user = userEvent.setup()
    render(<WorkflowEditor />)

    const baselinePaletteRenders = paletteRenderSpy.mock.calls.length
    const baselineCanvasRenders = canvasRenderSpy.mock.calls.length

    for (let index = 0; index < 25; index += 1) {
      await user.click(screen.getByRole("button", { name: "canvas-update-pointer" }))
    }

    expect(paletteRenderSpy.mock.calls.length).toBe(baselinePaletteRenders)
    expect(canvasRenderSpy.mock.calls.length).toBe(baselineCanvasRenders)
  })

  it("routes palette click to quick add confirmation when quick add is active", async () => {
    const user = userEvent.setup()
    renderCustomEditor(<QuickAddControls />)

    expect(screen.getByTestId("palette-quick-add-active").textContent).toBe("false")
    await user.click(screen.getByRole("button", { name: "test-start-quick-add" }))
    expect(screen.getByTestId("palette-quick-add-active").textContent).toBe("true")

    const beforeCount = Number(screen.getByTestId("canvas-node-count").textContent)
    await user.click(screen.getByRole("button", { name: "palette-add-node" }))
    const afterCount = Number(screen.getByTestId("canvas-node-count").textContent)

    expect(afterCount).toBe(beforeCount + 1)
    expect(screen.getByTestId("palette-quick-add-active").textContent).toBe("false")
  })

  it("re-opens hidden palette when quick add starts", async () => {
    const user = userEvent.setup()
    renderCustomEditor(<QuickAddControls />)

    expect(screen.getByTestId("palette-open").textContent).toBe("true")
    await user.click(screen.getByRole("button", { name: "Hide node palette" }))
    expect(screen.getByTestId("palette-open").textContent).toBe("false")

    await user.click(screen.getByRole("button", { name: "test-start-quick-add" }))
    expect(screen.getByTestId("palette-open").textContent).toBe("true")
    expect(screen.getByTestId("palette-quick-add-active").textContent).toBe("true")
  })

  it("cancels quick add through escape without changing canvas graph", async () => {
    const user = userEvent.setup()
    renderCustomEditor(<QuickAddControls />)

    const beforeCount = Number(screen.getByTestId("canvas-node-count").textContent)
    await user.click(screen.getByRole("button", { name: "test-start-quick-add" }))
    expect(screen.getByTestId("palette-quick-add-active").textContent).toBe("true")

    await user.keyboard("{Escape}")

    expect(screen.getByTestId("palette-quick-add-active").textContent).toBe("false")
    expect(Number(screen.getByTestId("canvas-node-count").textContent)).toBe(beforeCount)
  })

  it("updates the config panel when a node is selected", async () => {
    const user = userEvent.setup()
    render(<WorkflowEditor />)

    expect(
      screen.getByText("Select a node on the canvas to inspect it here.")
    ).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "canvas-select-first-node" }))

    expect(screen.getByLabelText("Label")).toBeTruthy()
    expect(screen.getByLabelText("Config preview")).toBeTruthy()
  })

  it("exposes the curated hooks namespace through WorkflowEditor.use", () => {
    renderCustomEditor(<HookProbe />)

    expect(screen.getByTestId("hook-graph-node-count").textContent).not.toBe("0")
    expect(screen.getByTestId("hook-selection-count").textContent).toBe("0")
    expect(screen.getByTestId("hook-actions-has-export").textContent).toBe("true")
  })
})
