"use client"

import {
  Panel,
  useStore,
  useStoreApi,
  type ReactFlowState,
  type XYPosition,
} from "@xyflow/react"
import { XYMinimap, type XYMinimapInstance } from "@xyflow/system"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { shallow } from "zustand/shallow"

import { workflowMiniMapStyles } from "../../../styles/components/canvas"
import { buildMiniMapGeometry, type MiniMapGeometry } from "./minimap-geometry"
import { MiniMapNodeLayer } from "./minimap-node-layer"
import {
  computeMiniMapLayout,
  frameRect,
  toFlowPosition,
  type MiniMapBox,
  type MiniMapLayout,
} from "./minimap-view"

/** React Flow's default mini map box and margin. */
const MINIMAP_BOX: MiniMapBox = { width: 200, height: 150, offsetScale: 5 }
/** The viewport frame's border; matches its `border-2` class. */
const MINIMAP_VIEWPORT_STROKE_WIDTH = 2

export interface WorkflowMiniMapProps {
  /** A click inside the mini map, with the flow position under the pointer. */
  onClick?: (event: React.MouseEvent, position: XYPosition) => void
}

/**
 * A selector that rebuilds the node geometry only when the node list changes.
 * Every store update calls it, a pan frame included, so the common case must
 * be a single reference check.
 */
function createGeometrySelector(): (state: ReactFlowState) => MiniMapGeometry {
  let lastNodes: ReactFlowState["nodes"] | undefined
  let lastGeometry: MiniMapGeometry = buildMiniMapGeometry([])
  return (state) => {
    if (state.nodes !== lastNodes) {
      lastNodes = state.nodes
      lastGeometry = buildMiniMapGeometry(state.nodeLookup.values())
    }
    return lastGeometry
  }
}

/** Everything React renders from besides the nodes; none of it is the pan. */
const selectSettings = (state: ReactFlowState) => ({
  panZoom: state.panZoom,
  translateExtent: state.translateExtent,
  paneWidth: state.width,
  paneHeight: state.height,
  rfId: state.rfId,
  ariaLabel: state.ariaLabelConfig["minimap.ariaLabel"],
})

const styles = workflowMiniMapStyles()

/**
 * The canvas mini map. Unlike React Flow's `MiniMap`, it keeps no per-node
 * store subscription and re-renders only when the nodes change. A pan writes
 * two compositor transforms, so it costs the same at any graph size and
 * never repaints the node layer.
 */
export function WorkflowMiniMap({ onClick }: WorkflowMiniMapProps) {
  const store = useStoreApi()
  const surfaceRef = useRef<HTMLDivElement>(null)
  const nodesLayerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<MiniMapLayout | null>(null)
  const selectGeometry = useMemo(() => createGeometrySelector(), [])
  const geometry = useStore(selectGeometry)
  const { panZoom, translateExtent, paneWidth, paneHeight, rfId, ariaLabel } =
    useStore(selectSettings, shallow)
  const nodeFrame = useMemo(
    () => (geometry.bounds ? frameRect(geometry.bounds, MINIMAP_BOX) : null),
    [geometry.bounds]
  )

  // Follows the viewport outside React: a pan frame only moves two layers.
  useLayoutEffect(() => {
    const applyLayout = (state: ReactFlowState) => {
      const layout = computeMiniMapLayout({
        nodeBounds: geometry.bounds,
        nodeFrame,
        transform: state.transform,
        paneWidth: state.width,
        paneHeight: state.height,
        box: MINIMAP_BOX,
        strokeWidth: MINIMAP_VIEWPORT_STROKE_WIDTH,
      })
      layoutRef.current = layout

      const nodesLayer = nodesLayerRef.current
      if (nodesLayer && layout.nodesTransform) {
        const { x, y, scale } = layout.nodesTransform
        nodesLayer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
      }

      const viewport = viewportRef.current
      if (viewport) {
        const { x, y, width, height } = layout.viewportBox
        viewport.style.transform = `translate(${x}px, ${y}px)`
        viewport.style.width = `${width}px`
        viewport.style.height = `${height}px`
      }
    }

    applyLayout(store.getState())
    return store.subscribe(applyLayout)
  }, [geometry.bounds, nodeFrame, store])

  const minimapRef = useRef<XYMinimapInstance | null>(null)
  useEffect(() => {
    if (!surfaceRef.current || !panZoom) {
      return
    }

    const instance = XYMinimap({
      domNode: surfaceRef.current,
      panZoom,
      getTransform: () => store.getState().transform,
      // Scales a drag in the mini map to the framing it currently shows.
      getViewScale: () => layoutRef.current?.frame.viewScale ?? 1,
    })
    minimapRef.current = instance
    return () => {
      instance.destroy()
      minimapRef.current = null
    }
  }, [panZoom, store])
  useEffect(() => {
    minimapRef.current?.update({
      translateExtent,
      width: paneWidth,
      height: paneHeight,
      pannable: true,
      zoomable: false,
    })
  }, [panZoom, translateExtent, paneWidth, paneHeight])

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const layout = layoutRef.current
      if (!onClick || !layout) {
        return
      }

      const box = event.currentTarget.getBoundingClientRect()
      onClick(
        event,
        toFlowPosition(
          layout,
          event.clientX - box.left,
          event.clientY - box.top
        )
      )
    },
    [onClick]
  )

  const labelId = `react-flow__minimap-desc-${rfId}`

  return (
    <Panel
      position="bottom-right"
      className={styles.root()}
      data-testid="rf__minimap"
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- click-to-pan is a pointer shortcut; the keyboard pans the canvas itself. */}
      <div
        ref={surfaceRef}
        className={styles.surface()}
        style={{ width: MINIMAP_BOX.width, height: MINIMAP_BOX.height }}
        role="img"
        aria-labelledby={labelId}
        onClick={handleClick}
        data-testid="workflow-minimap-surface"
      >
        <span id={labelId} hidden>
          {ariaLabel}
        </span>
        {nodeFrame ? (
          <div
            ref={nodesLayerRef}
            className={styles.nodesLayer()}
            data-testid="workflow-minimap-nodes-layer"
          >
            <svg
              width={MINIMAP_BOX.width}
              height={MINIMAP_BOX.height}
              viewBox={`${nodeFrame.viewBox.x} ${nodeFrame.viewBox.y} ${nodeFrame.viewBox.width} ${nodeFrame.viewBox.height}`}
              className={styles.svg()}
              aria-hidden
            >
              <MiniMapNodeLayer
                framesD={geometry.framesD}
                nodesD={geometry.nodesD}
              />
            </svg>
          </div>
        ) : null}
        <div
          ref={viewportRef}
          className={styles.viewport()}
          data-testid="workflow-minimap-viewport"
        />
      </div>
    </Panel>
  )
}
