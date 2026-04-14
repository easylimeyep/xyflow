// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useWorkflowStore, type WorkflowStoreState } from "../../store"
import { WorkflowStoreProvider } from "../../store"
import { WorkflowEditor } from "./workflow-editor"

const paletteRenderSpy = vi.fn()
const canvasRenderSpy = vi.fn()

vi.mock("../editor-toolbar", () => ({
  EditorToolbar: ({
    canUndo,
    onUndo,
  }: {
    canUndo: boolean
    onUndo: () => void
  }) => (
    <div>
      <span data-testid="toolbar-can-undo">{String(canUndo)}</span>
      <button type="button" onClick={onUndo}>
        toolbar-undo
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
        <span data-testid="palette-quick-add-active">{String(Boolean(quickAddActive))}</span>
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
    onViewportChange,
    onPointerFlowPosition,
    onPaneClick,
  }: {
    nodes: Array<{ id: string }>
    onSelectNodes: (nodeIds: string[]) => void
    onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void
    onPointerFlowPosition: (position: { x: number; y: number }) => void
    onPaneClick: () => void
  }) => {
    canvasRenderSpy()
    return (
      <div>
        <span data-testid="canvas-node-count">{String(nodes.length)}</span>
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
      </div>
    )
  },
}))

function renderWithStore(children: ReactNode) {
  return render(<WorkflowStoreProvider>{children}</WorkflowStoreProvider>)
}

function QuickAddControls() {
  const startQuickAddFromOutput = useWorkflowStore(
    (state: WorkflowStoreState) => state.startQuickAddFromOutput
  )
  const nodes = useWorkflowStore((state: WorkflowStoreState) => state.history.present.nodes)

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

describe("WorkflowEditor wiring", () => {
  afterEach(() => {
    cleanup()
    paletteRenderSpy.mockClear()
    canvasRenderSpy.mockClear()
  })

  it("adds node from palette and reflects updated canvas node count", async () => {
    const user = userEvent.setup()
    renderWithStore(<WorkflowEditor />)

    const beforeCount = Number(screen.getByTestId("canvas-node-count").textContent)
    await user.click(screen.getByRole("button", { name: "palette-add-node" }))
    const afterCount = Number(screen.getByTestId("canvas-node-count").textContent)

    expect(afterCount).toBe(beforeCount + 1)
    expect(screen.getByTestId("toolbar-can-undo").textContent).toBe("true")
  })

  it("does not rerender palette on viewport-only updates", async () => {
    const user = userEvent.setup()
    renderWithStore(<WorkflowEditor />)

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
    renderWithStore(<WorkflowEditor />)

    const baselinePaletteRenders = paletteRenderSpy.mock.calls.length
    const baselineCanvasRenders = canvasRenderSpy.mock.calls.length

    for (let index = 0; index < 25; index += 1) {
      await user.click(screen.getByRole("button", { name: "canvas-update-pointer" }))
    }

    // Perf budget: pointer tracking should not force toolbar/palette rerenders.
    expect(paletteRenderSpy.mock.calls.length).toBe(baselinePaletteRenders)
    expect(canvasRenderSpy.mock.calls.length).toBe(baselineCanvasRenders)
  })

  it("routes palette click to quick add confirmation when quick add is active", async () => {
    const user = userEvent.setup()
    renderWithStore(
      <>
        <QuickAddControls />
        <WorkflowEditor />
      </>
    )

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
    renderWithStore(
      <>
        <QuickAddControls />
        <WorkflowEditor />
      </>
    )

    expect(screen.getByTestId("palette-open").textContent).toBe("true")
    await user.click(screen.getByRole("button", { name: "Hide node palette" }))
    expect(screen.getByTestId("palette-open").textContent).toBe("false")

    await user.click(screen.getByRole("button", { name: "test-start-quick-add" }))
    expect(screen.getByTestId("palette-open").textContent).toBe("true")
    expect(screen.getByTestId("palette-quick-add-active").textContent).toBe("true")
  })

  it("cancels quick add through escape without changing canvas graph", async () => {
    const user = userEvent.setup()
    renderWithStore(
      <>
        <QuickAddControls />
        <WorkflowEditor />
      </>
    )

    const beforeCount = Number(screen.getByTestId("canvas-node-count").textContent)
    await user.click(screen.getByRole("button", { name: "test-start-quick-add" }))
    expect(screen.getByTestId("palette-quick-add-active").textContent).toBe("true")

    await user.keyboard("{Escape}")

    expect(screen.getByTestId("palette-quick-add-active").textContent).toBe("false")
    expect(Number(screen.getByTestId("canvas-node-count").textContent)).toBe(beforeCount)
  })

})
