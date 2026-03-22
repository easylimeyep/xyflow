// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { WORKFLOW_NODE_KIND_MIME } from "../dnd"
import { initialWorkflowGraph } from "../default-graph"
import { WorkflowCanvas } from "./workflow-canvas"

vi.mock("@xyflow/react", () => {
  return {
    ReactFlowProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    useReactFlow: () => ({
      screenToFlowPosition: ({ x, y }: { x: number; y: number }) => {
        const safeX = Number.isFinite(x) ? x : 10
        const safeY = Number.isFinite(y) ? y : 20
        return { x: safeX - 10, y: safeY - 20 }
      },
    }),
    ReactFlow: ({
      children,
      onDrop,
      onPaneClick,
      onSelectionChange,
      onMoveEnd,
      isValidConnection,
    }: {
      children: ReactNode
      onDrop: (event: React.DragEvent<HTMLDivElement>) => void
      onPaneClick: () => void
      onSelectionChange: (payload: { nodes: Array<{ id: string }> }) => void
      onMoveEnd: (event: unknown, viewport: { x: number; y: number; zoom: number }) => void
      isValidConnection: (connection: { source: string; target: string }) => boolean
    }) => (
      <div data-testid="rf-root" onDrop={onDrop}>
        <button
          type="button"
          data-testid="rf-select"
          onClick={() => onSelectionChange({ nodes: [{ id: "selected-node" }] })}
        />
        <button type="button" data-testid="rf-pane" onClick={onPaneClick} />
        <button
          type="button"
          data-testid="rf-move"
          onClick={() => onMoveEnd(null, { x: 12, y: 34, zoom: 1.25 })}
        />
        <span data-testid="rf-valid">
          {String(isValidConnection({ source: "missing", target: "missing" }))}
        </span>
        {children}
      </div>
    ),
  }
})

describe("WorkflowCanvas", () => {
  afterEach(() => {
    cleanup()
  })

  it("handles drop, viewport and selection interactions", () => {
    const onAddNodeAt = vi.fn()
    const onSelectNode = vi.fn()
    const onViewportChange = vi.fn()

    render(
      <WorkflowCanvas
        nodes={initialWorkflowGraph.nodes}
        edges={initialWorkflowGraph.edges}
        viewport={initialWorkflowGraph.viewport}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
        onConnect={vi.fn()}
        onViewportChange={onViewportChange}
        onSelectNode={onSelectNode}
        onAddNodeAt={onAddNodeAt}
      />
    )

    const dataTransfer = {
      getData: (key: string) => (key === WORKFLOW_NODE_KIND_MIME ? "code" : ""),
    } as DataTransfer
    fireEvent.drop(screen.getByTestId("rf-root"), {
      dataTransfer,
    })

    expect(onAddNodeAt).toHaveBeenCalledWith("code", { x: 0, y: 0 })

    fireEvent.click(screen.getByTestId("rf-select"))
    expect(onSelectNode).toHaveBeenCalledWith("selected-node")

    fireEvent.click(screen.getByTestId("rf-pane"))
    expect(onSelectNode).toHaveBeenCalledWith(null)

    fireEvent.click(screen.getByTestId("rf-move"))
    expect(onViewportChange).toHaveBeenCalledWith({ x: 12, y: 34, zoom: 1.25 })
  })

  it("uses shared connection validation for preview checks", () => {
    render(
      <WorkflowCanvas
        nodes={initialWorkflowGraph.nodes}
        edges={initialWorkflowGraph.edges}
        viewport={initialWorkflowGraph.viewport}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
        onConnect={vi.fn()}
        onViewportChange={vi.fn()}
        onSelectNode={vi.fn()}
        onAddNodeAt={vi.fn()}
      />
    )

    expect(screen.getByTestId("rf-valid").textContent).toBe("false")
  })
})
