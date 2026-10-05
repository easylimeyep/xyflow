// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import {
  ReactFlowProvider,
  useStoreApi,
  type Node,
  type ReactFlowState,
} from "@xyflow/react"
import { memo, Profiler, useEffect, type ComponentProps } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { buildMiniMapGeometry } from "./minimap-geometry"
import { computeMiniMapLayout, frameRect, toFlowPosition } from "./minimap-view"
import { WorkflowMiniMap } from "./workflow-minimap"

const minimapInstance = {
  update: vi.fn(),
  destroy: vi.fn(),
  pointer: vi.fn(),
}

vi.mock("@xyflow/system", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@xyflow/system")>()),
  XYMinimap: vi.fn(() => minimapInstance),
}))

const nodeLayerRenders = vi.fn()
const miniMapCommits = vi.fn()
const geometryBuilds = vi.fn()

vi.mock("./minimap-geometry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./minimap-geometry")>()
  return {
    ...actual,
    buildMiniMapGeometry: (
      ...args: Parameters<typeof actual.buildMiniMapGeometry>
    ) => {
      geometryBuilds()
      return actual.buildMiniMapGeometry(...args)
    },
  }
})

vi.mock("./minimap-node-layer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./minimap-node-layer")>()
  const Actual = actual.MiniMapNodeLayer
  return {
    // Same memo boundary as the real layer, with a render counter inside.
    MiniMapNodeLayer: memo(function CountingLayer(
      props: ComponentProps<typeof Actual>
    ) {
      nodeLayerRenders()
      return <Actual {...props} />
    }),
  }
})

type StoreApi = ReturnType<typeof useStoreApi>

function CaptureStore({ onStore }: { onStore: (store: StoreApi) => void }) {
  const store = useStoreApi()
  useEffect(() => {
    onStore(store)
  }, [onStore, store])
  return null
}

function createNode(id: string, x: number, width = 100, height = 50): Node {
  return {
    id,
    position: { x, y: 0 },
    data: {},
    measured: { width, height },
  }
}

function renderMiniMap(
  nodes: Node[],
  props: ComponentProps<typeof WorkflowMiniMap> = {}
) {
  let store: StoreApi | undefined
  const captureStore = (api: StoreApi) => {
    store = api
  }

  const view = render(
    <ReactFlowProvider
      initialNodes={nodes}
      initialWidth={800}
      initialHeight={600}
    >
      <CaptureStore onStore={captureStore} />
      <Profiler id="minimap" onRender={miniMapCommits}>
        <WorkflowMiniMap {...props} />
      </Profiler>
    </ReactFlowProvider>
  )
  if (!store) {
    throw new Error("expected the React Flow store")
  }
  return { ...view, store }
}

function setState(store: StoreApi, partial: Partial<ReactFlowState>) {
  act(() => {
    store.setState(partial)
  })
}

/** The layout the mini map should show for the store's current state. */
function expectedLayout(store: StoreApi) {
  const state = store.getState()
  const { bounds } = buildMiniMapGeometry(state.nodeLookup.values())
  const box = { width: 200, height: 150, offsetScale: 5 }
  return computeMiniMapLayout({
    nodeBounds: bounds,
    nodeFrame: bounds ? frameRect(bounds, box) : null,
    transform: state.transform,
    paneWidth: state.width,
    paneHeight: state.height,
    box,
    strokeWidth: 2,
  })
}

/** Enough of a pan/zoom instance for the mini map to attach its handler. */
const fakePanZoom = {} as ReactFlowState["panZoom"]

describe("WorkflowMiniMap", () => {
  beforeEach(() => {
    nodeLayerRenders.mockClear()
    miniMapCommits.mockClear()
    geometryBuilds.mockClear()
    minimapInstance.update.mockClear()
    minimapInstance.destroy.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it("draws every node in one path inside React Flow's mini map classes", () => {
    const { container } = renderMiniMap([
      createNode("a", 0),
      createNode("b", 300),
    ])

    const nodesPath = screen.getByTestId("workflow-minimap-nodes")
    expect(nodesPath.getAttribute("class")).toContain(
      "react-flow__minimap-node"
    )
    expect(nodesPath.getAttribute("d")?.split("Z")).toHaveLength(3)
    expect(container.querySelector(".react-flow__minimap")).not.toBeNull()
    expect(container.querySelector(".react-flow__minimap-svg")).not.toBeNull()
  })

  it("moves only the two layers when the canvas pans, without a React render", () => {
    const { store } = renderMiniMap([createNode("a", 0), createNode("b", 300)])
    const nodesLayer = screen.getByTestId("workflow-minimap-nodes-layer")
    const viewport = screen.getByTestId("workflow-minimap-viewport")
    const nodesBefore = nodesLayer.style.transform
    const viewportBefore = viewport.style.transform
    const commitsBefore = miniMapCommits.mock.calls.length
    const rendersBefore = nodeLayerRenders.mock.calls.length
    const buildsBefore = geometryBuilds.mock.calls.length

    setState(store, { transform: [-2000, -1500, 0.5] })

    expect(geometryBuilds.mock.calls.length).toBe(buildsBefore)
    expect(nodeLayerRenders.mock.calls.length).toBe(rendersBefore)
    expect(miniMapCommits.mock.calls.length).toBe(commitsBefore)
    expect(nodesLayer.style.transform).not.toBe(nodesBefore)
    expect(viewport.style.transform).not.toBe(viewportBefore)
  })

  it("places the viewport frame over the visible part of the flow", () => {
    const { store } = renderMiniMap([createNode("a", 0, 4000, 3000)])

    setState(store, { transform: [-400, -300, 1] })

    const viewport = screen.getByTestId("workflow-minimap-viewport")
    const { x, y, width, height } = expectedLayout(store).viewportBox
    expect(viewport.style.transform).toBe(`translate(${x}px, ${y}px)`)
    expect(viewport.style.width).toBe(`${width}px`)
    expect(viewport.style.height).toBe(`${height}px`)
  })

  it("redraws the node layer when a node moves", () => {
    const { store } = renderMiniMap([createNode("a", 0)])
    const before = screen
      .getByTestId("workflow-minimap-nodes")
      .getAttribute("d")
    const rendersBefore = nodeLayerRenders.mock.calls.length

    act(() => {
      store.getState().setNodes([createNode("a", 500)])
    })

    expect(nodeLayerRenders.mock.calls.length).toBe(rendersBefore + 1)
    expect(
      screen.getByTestId("workflow-minimap-nodes").getAttribute("d")
    ).not.toBe(before)
  })

  it("follows a node size React Flow measured after the first render", () => {
    const { store } = renderMiniMap([
      createNode("a", 0),
      { id: "b", position: { x: 300, y: 0 }, data: {} },
    ])
    const countShapes = () =>
      screen.getByTestId("workflow-minimap-nodes").getAttribute("d")?.split("Z")
        .length

    expect(countShapes()).toBe(2)

    // The controlled graph hands the measured size back as new nodes.
    act(() => {
      store.getState().setNodes([createNode("a", 0), createNode("b", 300)])
    })

    expect(countShapes()).toBe(3)
  })

  it("leaves hidden nodes out", () => {
    renderMiniMap([
      createNode("a", 0),
      { ...createNode("b", 300), hidden: true },
    ])

    expect(
      screen.getByTestId("workflow-minimap-nodes").getAttribute("d")?.split("Z")
    ).toHaveLength(2)
  })

  it("draws only the viewport frame for an empty graph", () => {
    renderMiniMap([])

    expect(screen.queryByTestId("workflow-minimap-nodes-layer")).toBeNull()
    expect(screen.getByTestId("workflow-minimap-viewport")).toBeTruthy()
  })

  it("pans by drag and never zooms by wheel", () => {
    const { store, unmount } = renderMiniMap([createNode("a", 0)])

    setState(store, { panZoom: fakePanZoom })

    expect(minimapInstance.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pannable: true,
        zoomable: false,
        width: 800,
        height: 600,
      })
    )

    unmount()

    expect(minimapInstance.destroy).toHaveBeenCalledTimes(1)
  })

  it("reports a click with the flow position under the pointer", () => {
    const onClick = vi.fn()
    const { store } = renderMiniMap([createNode("a", 0, 4000, 3000)], {
      onClick,
    })

    // jsdom puts the surface at the origin, so the client point is the offset.
    fireEvent.click(screen.getByTestId("workflow-minimap-surface"), {
      clientX: 50,
      clientY: 30,
    })

    expect(onClick).toHaveBeenCalledWith(
      expect.anything(),
      toFlowPosition(expectedLayout(store), 50, 30)
    )
  })

  it("frames the viewport with a two-pixel primary border", () => {
    const viewport = renderMiniMap([createNode("a", 0)]).getByTestId(
      "workflow-minimap-viewport"
    )

    expect(viewport.className).toContain("border-2")
    expect(viewport.className).toContain("border-primary")
  })
})
