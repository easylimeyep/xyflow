// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { readFileSync } from "node:fs"
import type { MouseEvent, ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { WORKFLOW_NODE_KIND_MIME } from "../../dnd"
import { initialWorkflowGraph } from "../../default-graph"
import { createWorkflowNode } from "../../node-registry"
import { WorkflowCanvas } from "./workflow-canvas"

const fixtureSource = createWorkflowNode("inlineExpression", { x: 0, y: 80 })
fixtureSource.data.config.isRoot = true
const fixtureTarget = createWorkflowNode("inlineExpression", { x: 360, y: 80 })
const fixtureEdge = {
  id: `${fixtureSource.id}-${fixtureTarget.id}`,
  source: fixtureSource.id,
  target: fixtureTarget.id,
  sourceHandle: null,
  targetHandle: null,
  data: {
    sourceKind: "inlineExpression" as const,
    targetKind: "inlineExpression" as const,
  },
}
const fixtureGraphWithEdge = {
  ...initialWorkflowGraph,
  nodes: [fixtureSource, fixtureTarget],
  edges: [fixtureEdge],
}

const reactFlowRenderSpy = vi.fn()
const fitViewSpy = vi.fn()
const setCenterSpy = vi.fn()
const getViewportSpy = vi.fn(() => ({ x: 24, y: 48, zoom: 1.75 }))

vi.mock("../workflow-edge", () => {
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
        <button
          type="button"
          data-testid={`mock-edge-insert-${id}`}
          onClick={() => onStartInsert(id)}
        />
        <button
          type="button"
          data-testid={`mock-edge-delete-${id}`}
          onClick={() => onDeleteEdge(id)}
        />
      </div>
    ),
  }
})

vi.mock("@xyflow/react", () => {
  return {
    ReactFlowProvider: ({ children }: { children: ReactNode }) => (
      <>{children}</>
    ),
    Background: () => null,
    Controls: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    ControlButton: ({
      children,
      onClick,
      ...props
    }: {
      children: ReactNode
      onClick: () => void
    }) => (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    MiniMap: ({
      onClick,
      pannable,
      zoomable,
      maskStrokeColor,
      maskStrokeWidth,
    }: {
      onClick?: (event: MouseEvent, position: { x: number; y: number }) => void
      pannable?: boolean
      zoomable?: boolean
      maskStrokeColor?: string
      maskStrokeWidth?: number
    }) => (
      <div data-testid="rf-minimap">
        <span data-testid="rf-minimap-pannable">
          {String(Boolean(pannable))}
        </span>
        <span data-testid="rf-minimap-zoomable">{String(zoomable)}</span>
        <span data-testid="rf-minimap-mask-stroke-color">
          {maskStrokeColor}
        </span>
        <span data-testid="rf-minimap-mask-stroke-width">
          {String(maskStrokeWidth)}
        </span>
        <button
          type="button"
          data-testid="rf-minimap-click"
          onClick={(event) => onClick?.(event, { x: 420, y: 240 })}
        />
        <button
          type="button"
          data-testid="rf-minimap-node-click"
          onClick={(event) => onClick?.(event, { x: 320, y: 180 })}
        />
      </div>
    ),
    useReactFlow: () => ({
      fitView: fitViewSpy,
      getViewport: getViewportSpy,
      setCenter: setCenterSpy,
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
      minZoom,
      maxZoom,
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
      onMoveEnd: (
        event: unknown,
        viewport: { x: number; y: number; zoom: number }
      ) => void
      onMouseMove: (event: { clientX: number; clientY: number }) => void
      isValidConnection: (connection: {
        source: string
        target: string
      }) => boolean
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
      minZoom?: number
      maxZoom?: number
    }) => {
      reactFlowRenderSpy({ edgeTypes })
      return (
        <div data-testid="rf-root" onDrop={onDrop}>
          <span data-testid="rf-has-default-viewport">
            {String(Boolean(defaultViewport))}
          </span>
          <span data-testid="rf-has-viewport">{String(Boolean(viewport))}</span>
          <span data-testid="rf-selection-on-drag">
            {String(Boolean(selectionOnDrag))}
          </span>
          <span data-testid="rf-pan-on-drag">{String(panOnDrag)}</span>
          <span data-testid="rf-pan-on-scroll">
            {String(Boolean(panOnScroll))}
          </span>
          <span data-testid="rf-zoom-on-pinch">
            {String(Boolean(zoomOnPinch))}
          </span>
          <span data-testid="rf-zoom-on-scroll">{String(zoomOnScroll)}</span>
          <span data-testid="rf-min-zoom">{String(minZoom)}</span>
          <span data-testid="rf-max-zoom">{String(maxZoom)}</span>
          <button
            type="button"
            data-testid="rf-mousemove"
            onClick={() => onMouseMove({ clientX: 210, clientY: 120 })}
          />
          <button
            type="button"
            data-testid="rf-select"
            onClick={() =>
              onNodesChange([
                { id: "selected-node", type: "select", selected: true },
              ])
            }
          />
          <button type="button" data-testid="rf-pane" onClick={onPaneClick} />
          <button
            type="button"
            data-testid="rf-move"
            onClick={() => onMoveEnd(null, { x: 12, y: 34, zoom: 1.25 })}
          />
          <span data-testid="rf-valid">
            {String(
              isValidConnection({ source: "missing", target: "missing" })
            )}
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
    fitViewSpy.mockReset()
    setCenterSpy.mockReset()
    getViewportSpy.mockClear()
    vi.unstubAllGlobals()
    vi.useRealTimers()
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
        onAutoLayout={vi.fn(async () => true)}
      />
    )

    const dataTransfer = {
      getData: (key: string) =>
        key === WORKFLOW_NODE_KIND_MIME ? "extractor" : "",
    } as DataTransfer
    fireEvent.drop(screen.getByTestId("rf-root"), {
      dataTransfer,
    })

    expect(onAddNodeAt).toHaveBeenCalledWith("extractor", { x: 0, y: 0 })

    fireEvent.click(screen.getByTestId("rf-select"))
    await waitFor(() => {
      expect(onSelectNodes).toHaveBeenCalledWith(["selected-node"])
    })
    fireEvent.click(screen.getByTestId("rf-select"))
    expect(onSelectNodes).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId("rf-pane"))
    expect(onPaneClick).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId("rf-mousemove"))
    await waitFor(() => {
      expect(onPointerFlowPosition).toHaveBeenCalledWith({ x: 200, y: 100 })
    })

    fireEvent.click(screen.getByTestId("rf-move"))
    expect(onViewportChange).toHaveBeenCalledWith({ x: 12, y: 34, zoom: 1.25 })
    expect(screen.getByTestId("rf-has-default-viewport").textContent).toBe(
      "true"
    )
    expect(screen.getByTestId("rf-has-viewport").textContent).toBe("false")
    expect(screen.getByTestId("rf-selection-on-drag").textContent).toBe("true")
    expect(screen.getByTestId("rf-pan-on-drag").textContent).toBe("false")
    expect(screen.getByTestId("rf-pan-on-scroll").textContent).toBe("true")
    expect(screen.getByTestId("rf-zoom-on-pinch").textContent).toBe("true")
    expect(screen.getByTestId("rf-zoom-on-scroll").textContent).toBe("false")
    expect(screen.getByTestId("rf-min-zoom").textContent).toBe("0.1")
    expect(screen.getByTestId("rf-max-zoom").textContent).toBe("4")
  })

  it("configures mini map navigation, viewport styling, and click centering", () => {
    const onSelectNodes = vi.fn()

    render(
      <WorkflowCanvas
        nodes={initialWorkflowGraph.nodes}
        edges={initialWorkflowGraph.edges}
        viewport={initialWorkflowGraph.viewport}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
        onConnect={vi.fn()}
        onViewportChange={vi.fn()}
        onSelectNodes={onSelectNodes}
        onPaneClick={vi.fn()}
        onAddNodeAt={vi.fn()}
        onStartInsertFromEdge={vi.fn()}
        onDeleteEdge={vi.fn()}
        onPointerFlowPosition={vi.fn()}
        edgeInsertPendingId={null}
        onAutoLayout={vi.fn(async () => true)}
      />
    )

    expect(screen.getByTestId("rf-minimap-pannable").textContent).toBe("true")
    expect(screen.getByTestId("rf-minimap-zoomable").textContent).toBe("false")
    expect(screen.getByTestId("rf-minimap-mask-stroke-color").textContent).toBe(
      "var(--primary)"
    )
    expect(screen.getByTestId("rf-minimap-mask-stroke-width").textContent).toBe(
      "2"
    )

    fireEvent.click(screen.getByTestId("rf-minimap-click"))

    expect(getViewportSpy).toHaveBeenCalledTimes(1)
    expect(setCenterSpy).toHaveBeenCalledWith(420, 240, {
      zoom: 1.75,
      duration: 200,
    })

    fireEvent.click(screen.getByTestId("rf-minimap-node-click"))

    expect(onSelectNodes).not.toHaveBeenCalled()
    expect(setCenterSpy).toHaveBeenLastCalledWith(320, 180, {
      zoom: 1.75,
      duration: 200,
    })
  })

  it("keeps mini map outer container rounded and clipped in shared styles", () => {
    const styleSheet = readFileSync("src/style.css", "utf8")

    expect(styleSheet).toContain(".react-flow__minimap")
    expect(styleSheet).toContain("border-radius: var(--radius-md);")
    expect(styleSheet).toContain("overflow: hidden;")
    expect(styleSheet).toContain(
      "bottom: calc(var(--flow-editor-controls-height) + 0.5rem);"
    )
    expect(styleSheet).toContain("left: 0;")
  })

  it("renders auto-layout control and refits viewport after success", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 16)
    )
    vi.stubGlobal("cancelAnimationFrame", (handle: number) => {
      window.clearTimeout(handle)
    })
    const onAutoLayout = vi.fn(async () => true)

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
        onAutoLayout={onAutoLayout}
      />
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Auto layout workflow" })
    )
    await Promise.resolve()
    expect(onAutoLayout).toHaveBeenCalledTimes(1)

    vi.runAllTimers()
    expect(fitViewSpy).toHaveBeenCalledWith({
      padding: 0.2,
      minZoom: 0.1,
      maxZoom: 4,
    })
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
        onAutoLayout={vi.fn(async () => true)}
      />
    )

    expect(screen.getByTestId("rf-valid").textContent).toBe("false")
  })

  it("routes edge action buttons to handlers", () => {
    const onStartInsertFromEdge = vi.fn()
    const onDeleteEdge = vi.fn()
    const edgeId = fixtureGraphWithEdge.edges[0]?.id
    if (!edgeId) {
      throw new Error("fixture edge id not found")
    }

    render(
      <WorkflowCanvas
        nodes={fixtureGraphWithEdge.nodes}
        edges={fixtureGraphWithEdge.edges}
        viewport={fixtureGraphWithEdge.viewport}
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
        onAutoLayout={vi.fn(async () => true)}
      />
    )

    fireEvent.click(screen.getByTestId(`mock-edge-insert-${edgeId}`))
    fireEvent.click(screen.getByTestId(`mock-edge-delete-${edgeId}`))

    expect(onStartInsertFromEdge).toHaveBeenCalledWith(edgeId)
    expect(onDeleteEdge).toHaveBeenCalledWith(edgeId)
  })

  it("keeps edgeTypes stable and uses latest edge handlers after rerender", () => {
    const edgeId = fixtureGraphWithEdge.edges[0]?.id
    if (!edgeId) {
      throw new Error("fixture edge id not found")
    }

    const onStartInsertInitial = vi.fn()
    const onDeleteEdgeInitial = vi.fn()
    const onStartInsertNext = vi.fn()
    const onDeleteEdgeNext = vi.fn()
    const { rerender } = render(
      <WorkflowCanvas
        nodes={fixtureGraphWithEdge.nodes}
        edges={fixtureGraphWithEdge.edges}
        viewport={fixtureGraphWithEdge.viewport}
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
        onAutoLayout={vi.fn(async () => true)}
      />
    )

    const firstEdgeTypes = reactFlowRenderSpy.mock.calls.at(-1)?.[0]?.edgeTypes
    rerender(
      <WorkflowCanvas
        nodes={fixtureGraphWithEdge.nodes}
        edges={fixtureGraphWithEdge.edges}
        viewport={fixtureGraphWithEdge.viewport}
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
        onAutoLayout={vi.fn(async () => true)}
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

  it("batches pointer updates to one store write per animation frame", () => {
    vi.useFakeTimers()
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 16)
    )
    vi.stubGlobal("cancelAnimationFrame", (handle: number) => {
      window.clearTimeout(handle)
    })
    const onPointerFlowPosition = vi.fn()

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
        onPointerFlowPosition={onPointerFlowPosition}
        edgeInsertPendingId={null}
        onAutoLayout={vi.fn(async () => true)}
      />
    )

    fireEvent.click(screen.getByTestId("rf-mousemove"))
    fireEvent.click(screen.getByTestId("rf-mousemove"))

    expect(onPointerFlowPosition).not.toHaveBeenCalled()

    vi.advanceTimersByTime(16)

    expect(onPointerFlowPosition).toHaveBeenCalledTimes(1)
    expect(onPointerFlowPosition).toHaveBeenCalledWith({ x: 200, y: 100 })
  })
})
