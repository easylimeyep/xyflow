// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { WORKFLOW_NODE_KIND_MIME } from "../dnd"
import { initialWorkflowGraph } from "../default-graph"
import { WorkflowCanvas } from "./workflow-canvas"

const reactFlowRenderSpy = vi.fn()

vi.mock("./workflow-edge", () => {
  return {
    WorkflowEdgeComponent: ({
      id,
      onStartInsert,
      onDeleteEdge,
    }: {
      id: string
      onStartInsert: (edgeId: string) => void
      onDeleteEdge: (edgeId: string) => void
    }) => (
      <div data-testid={`mock-workflow-edge-${id}`}>
        <button type="button" data-testid={`mock-edge-insert-${id}`} onClick={() => onStartInsert(id)} />
        <button type="button" data-testid={`mock-edge-delete-${id}`} onClick={() => onDeleteEdge(id)} />
      </div>
    ),
  }
})

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
      onNodesChange,
      onMoveEnd,
      onMouseMove,
      isValidConnection,
      defaultViewport,
      viewport,
      edges,
      edgeTypes,
      selectionOnDrag,
      panOnDrag,
      panOnScroll,
      zoomOnPinch,
      zoomOnScroll,
    }: {
      children: ReactNode
      onDrop: (event: React.DragEvent<HTMLDivElement>) => void
      onPaneClick: () => void
      onNodesChange: (
        changes: Array<{
          id: string
          type: "select"
          selected: boolean
        }>
      ) => void
      onMoveEnd: (event: unknown, viewport: { x: number; y: number; zoom: number }) => void
      onMouseMove: (event: { clientX: number; clientY: number }) => void
      isValidConnection: (connection: { source: string; target: string }) => boolean
      defaultViewport?: { x: number; y: number; zoom: number }
      viewport?: { x: number; y: number; zoom: number }
      edges?: Array<{
        id: string
        source: string
        target: string
        type?: string
        sourceHandle?: string | null
        targetHandle?: string | null
        data?: unknown
      }>
      edgeTypes?: Record<string, (props: Record<string, unknown>) => ReactNode>
      selectionOnDrag?: boolean
      panOnDrag?: boolean
      panOnScroll?: boolean
      zoomOnPinch?: boolean
      zoomOnScroll?: boolean
    }) => {
      reactFlowRenderSpy({ edgeTypes })
      return (
        <div data-testid="rf-root" onDrop={onDrop}>
          <span data-testid="rf-has-default-viewport">{String(Boolean(defaultViewport))}</span>
          <span data-testid="rf-has-viewport">{String(Boolean(viewport))}</span>
          <span data-testid="rf-selection-on-drag">{String(Boolean(selectionOnDrag))}</span>
          <span data-testid="rf-pan-on-drag">{String(panOnDrag)}</span>
          <span data-testid="rf-pan-on-scroll">{String(Boolean(panOnScroll))}</span>
          <span data-testid="rf-zoom-on-pinch">{String(Boolean(zoomOnPinch))}</span>
          <span data-testid="rf-zoom-on-scroll">{String(zoomOnScroll)}</span>
          <button
            type="button"
            data-testid="rf-mousemove"
            onClick={() => onMouseMove({ clientX: 210, clientY: 120 })}
          />
          <button
            type="button"
            data-testid="rf-select"
            onClick={() =>
              onNodesChange([{ id: "selected-node", type: "select", selected: true }])
            }
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
          {edges?.map((edge) => {
            const EdgeTypeComponent = edgeTypes?.[edge.type ?? "workflow"]
            if (!EdgeTypeComponent) {
              return null
            }
            return (
              <EdgeTypeComponent
                key={edge.id}
                id={edge.id}
                source={edge.source}
                target={edge.target}
                sourceX={10}
                sourceY={10}
                targetX={50}
                targetY={10}
                sourcePosition="right"
                targetPosition="left"
                sourceHandleId={edge.sourceHandle ?? undefined}
                targetHandleId={edge.targetHandle ?? undefined}
                selected={false}
                data={edge.data}
              />
            )
          })}
          {children}
        </div>
      )
    },
  }
})

describe("WorkflowCanvas", () => {
  afterEach(() => {
    cleanup()
    reactFlowRenderSpy.mockClear()
  })

  it("handles drop, viewport and selection interactions", async () => {
    const onAddNodeAt = vi.fn()
    const onSelectNodes = vi.fn()
    const onViewportChange = vi.fn()
    const onPaneClick = vi.fn()
    const onPointerFlowPosition = vi.fn()

    render(
      <WorkflowCanvas
        nodes={initialWorkflowGraph.nodes}
        edges={initialWorkflowGraph.edges}
        viewport={initialWorkflowGraph.viewport}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
        onConnect={vi.fn()}
        onViewportChange={onViewportChange}
        onSelectNodes={onSelectNodes}
        onPaneClick={onPaneClick}
        onAddNodeAt={onAddNodeAt}
        onStartInsertFromEdge={vi.fn()}
        onDeleteEdge={vi.fn()}
        onPointerFlowPosition={onPointerFlowPosition}
        edgeInsertPendingId={null}
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
    await waitFor(() => {
      expect(onSelectNodes).toHaveBeenCalledWith(["selected-node"])
    })
    fireEvent.click(screen.getByTestId("rf-select"))
    expect(onSelectNodes).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId("rf-pane"))
    expect(onPaneClick).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId("rf-mousemove"))
    expect(onPointerFlowPosition).toHaveBeenCalledWith({ x: 200, y: 100 })

    fireEvent.click(screen.getByTestId("rf-move"))
    expect(onViewportChange).toHaveBeenCalledWith({ x: 12, y: 34, zoom: 1.25 })
    expect(screen.getByTestId("rf-has-default-viewport").textContent).toBe("true")
    expect(screen.getByTestId("rf-has-viewport").textContent).toBe("false")
    expect(screen.getByTestId("rf-selection-on-drag").textContent).toBe("true")
    expect(screen.getByTestId("rf-pan-on-drag").textContent).toBe("false")
    expect(screen.getByTestId("rf-pan-on-scroll").textContent).toBe("true")
    expect(screen.getByTestId("rf-zoom-on-pinch").textContent).toBe("true")
    expect(screen.getByTestId("rf-zoom-on-scroll").textContent).toBe("false")
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
        onSelectNodes={vi.fn()}
        onPaneClick={vi.fn()}
        onAddNodeAt={vi.fn()}
        onStartInsertFromEdge={vi.fn()}
        onDeleteEdge={vi.fn()}
        onPointerFlowPosition={vi.fn()}
        edgeInsertPendingId={null}
      />
    )

    expect(screen.getByTestId("rf-valid").textContent).toBe("false")
  })

  it("routes edge action buttons to handlers", () => {
    const onStartInsertFromEdge = vi.fn()
    const onDeleteEdge = vi.fn()
    const edgeId = initialWorkflowGraph.edges[0]?.id
    if (!edgeId) {
      throw new Error("fixture edge id not found")
    }

    render(
      <WorkflowCanvas
        nodes={initialWorkflowGraph.nodes}
        edges={initialWorkflowGraph.edges}
        viewport={initialWorkflowGraph.viewport}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
        onConnect={vi.fn()}
        onViewportChange={vi.fn()}
        onSelectNodes={vi.fn()}
        onPaneClick={vi.fn()}
        onAddNodeAt={vi.fn()}
        onStartInsertFromEdge={onStartInsertFromEdge}
        onDeleteEdge={onDeleteEdge}
        onPointerFlowPosition={vi.fn()}
        edgeInsertPendingId={null}
      />
    )

    fireEvent.click(screen.getByTestId(`mock-edge-insert-${edgeId}`))
    fireEvent.click(screen.getByTestId(`mock-edge-delete-${edgeId}`))

    expect(onStartInsertFromEdge).toHaveBeenCalledWith(edgeId)
    expect(onDeleteEdge).toHaveBeenCalledWith(edgeId)
  })

  it("keeps edgeTypes stable and uses latest edge handlers after rerender", () => {
    const edgeId = initialWorkflowGraph.edges[0]?.id
    if (!edgeId) {
      throw new Error("fixture edge id not found")
    }

    const onStartInsertInitial = vi.fn()
    const onDeleteEdgeInitial = vi.fn()
    const onStartInsertNext = vi.fn()
    const onDeleteEdgeNext = vi.fn()
    const { rerender } = render(
      <WorkflowCanvas
        nodes={initialWorkflowGraph.nodes}
        edges={initialWorkflowGraph.edges}
        viewport={initialWorkflowGraph.viewport}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
        onConnect={vi.fn()}
        onViewportChange={vi.fn()}
        onSelectNodes={vi.fn()}
        onPaneClick={vi.fn()}
        onAddNodeAt={vi.fn()}
        onStartInsertFromEdge={onStartInsertInitial}
        onDeleteEdge={onDeleteEdgeInitial}
        onPointerFlowPosition={vi.fn()}
        edgeInsertPendingId={null}
      />
    )

    const firstEdgeTypes = reactFlowRenderSpy.mock.calls.at(-1)?.[0]?.edgeTypes
    rerender(
      <WorkflowCanvas
        nodes={initialWorkflowGraph.nodes}
        edges={initialWorkflowGraph.edges}
        viewport={initialWorkflowGraph.viewport}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
        onConnect={vi.fn()}
        onViewportChange={vi.fn()}
        onSelectNodes={vi.fn()}
        onPaneClick={vi.fn()}
        onAddNodeAt={vi.fn()}
        onStartInsertFromEdge={onStartInsertNext}
        onDeleteEdge={onDeleteEdgeNext}
        onPointerFlowPosition={vi.fn()}
        edgeInsertPendingId={edgeId}
      />
    )
    const secondEdgeTypes = reactFlowRenderSpy.mock.calls.at(-1)?.[0]?.edgeTypes

    expect(firstEdgeTypes).toBeDefined()
    expect(secondEdgeTypes).toBe(firstEdgeTypes)

    fireEvent.click(screen.getByTestId(`mock-edge-insert-${edgeId}`))
    fireEvent.click(screen.getByTestId(`mock-edge-delete-${edgeId}`))

    expect(onStartInsertInitial).not.toHaveBeenCalled()
    expect(onDeleteEdgeInitial).not.toHaveBeenCalled()
    expect(onStartInsertNext).toHaveBeenCalledWith(edgeId)
    expect(onDeleteEdgeNext).toHaveBeenCalledWith(edgeId)
  })
})
