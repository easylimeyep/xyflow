// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { WorkflowStoreProvider } from "../store"
import { WorkflowEditor } from "./workflow-editor"

const paletteRenderSpy = vi.fn()
const canvasRenderSpy = vi.fn()
const configPanelRenderSpy = vi.fn()

vi.mock("./editor-toolbar", () => ({
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

vi.mock("./node-palette", () => ({
  NodePalette: ({ onAddNode }: { onAddNode: (kind: string) => void }) => {
    paletteRenderSpy()
    return (
      <button type="button" onClick={() => onAddNode("trigger")}>
        palette-add-trigger
      </button>
    )
  },
}))

vi.mock("./workflow-canvas", () => ({
  WorkflowCanvas: ({
    nodes,
    onSelectNode,
    onViewportChange,
  }: {
    nodes: Array<{ id: string }>
    onSelectNode: (nodeId: string | null) => void
    onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void
  }) => {
    canvasRenderSpy()
    return (
      <div>
        <span data-testid="canvas-node-count">{String(nodes.length)}</span>
        <button
          type="button"
          onClick={() => {
            const firstId = nodes[0]?.id ?? null
            onSelectNode(firstId)
          }}
        >
          canvas-select-first
        </button>
        <button
          type="button"
          onClick={() => onViewportChange({ x: 100, y: 50, zoom: 1.2 })}
        >
          canvas-update-viewport
        </button>
      </div>
    )
  },
}))

vi.mock("./node-config-panel", () => ({
  NodeConfigPanel: ({
    selectedNode,
    onUpdateLabel,
  }: {
    selectedNode: { id: string; data: { label: string } } | null
    onUpdateLabel: (nodeId: string, value: string) => void
  }) => {
    configPanelRenderSpy()
    return (
      <div>
        <span data-testid="selected-node-id">{selectedNode?.id ?? "none"}</span>
        <span data-testid="selected-node-label">{selectedNode?.data.label ?? "none"}</span>
        <button
          type="button"
          onClick={() => {
            if (selectedNode) {
              onUpdateLabel(selectedNode.id, "Changed label")
            }
          }}
        >
          panel-update-label
        </button>
      </div>
    )
  },
}))

function renderWithStore(children: ReactNode) {
  return render(<WorkflowStoreProvider>{children}</WorkflowStoreProvider>)
}

describe("WorkflowEditor wiring", () => {
  afterEach(() => {
    cleanup()
    paletteRenderSpy.mockClear()
    canvasRenderSpy.mockClear()
    configPanelRenderSpy.mockClear()
  })

  it("adds node from palette and reflects updated canvas node count", async () => {
    const user = userEvent.setup()
    renderWithStore(<WorkflowEditor />)

    const beforeCount = Number(screen.getByTestId("canvas-node-count").textContent)
    await user.click(screen.getByRole("button", { name: "palette-add-trigger" }))
    const afterCount = Number(screen.getByTestId("canvas-node-count").textContent)

    expect(afterCount).toBe(beforeCount + 1)
    expect(screen.getByTestId("toolbar-can-undo").textContent).toBe("true")
  })

  it("syncs selection from canvas into config panel", async () => {
    const user = userEvent.setup()
    renderWithStore(<WorkflowEditor />)

    expect(screen.getByTestId("selected-node-id").textContent).toBe("none")
    await user.click(screen.getByRole("button", { name: "canvas-select-first" }))
    expect(screen.getByTestId("selected-node-id").textContent).not.toBe("none")
  })

  it("updates selected node label through panel callback", async () => {
    const user = userEvent.setup()
    renderWithStore(<WorkflowEditor />)

    await user.click(screen.getByRole("button", { name: "canvas-select-first" }))
    await user.click(screen.getByRole("button", { name: "panel-update-label" }))
    expect(screen.getByTestId("selected-node-label").textContent).toBe("Changed label")
  })

  it("does not rerender config panel and palette on viewport-only updates", async () => {
    const user = userEvent.setup()
    renderWithStore(<WorkflowEditor />)

    expect(configPanelRenderSpy).toHaveBeenCalledTimes(1)
    expect(paletteRenderSpy).toHaveBeenCalledTimes(1)
    expect(canvasRenderSpy).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole("button", { name: "canvas-update-viewport" }))
    await user.click(screen.getByRole("button", { name: "canvas-update-viewport" }))
    await user.click(screen.getByRole("button", { name: "canvas-update-viewport" }))

    expect(canvasRenderSpy).toHaveBeenCalledTimes(1)
    expect(configPanelRenderSpy).toHaveBeenCalledTimes(1)
    expect(paletteRenderSpy).toHaveBeenCalledTimes(1)
  })
})
