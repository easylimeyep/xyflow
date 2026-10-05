import type { Rect, Transform, XYPosition } from "@xyflow/react"
import { getBoundsOfRects } from "@xyflow/system"

/** The mini map's box in pixels, and its margin around the framed area. */
export interface MiniMapBox {
  width: number
  height: number
  offsetScale: number
}

export interface MiniMapFrame {
  /** The flow area the mini map shows. */
  viewBox: Rect
  /** Flow units per mini map pixel of the framed area, as React Flow uses it. */
  viewScale: number
}

/**
 * Frames a flow rectangle the way React Flow's `MiniMap` does: fitted to the
 * box, centered, with a margin of `offsetScale` pixels.
 */
export function frameRect(rect: Rect, box: MiniMapBox): MiniMapFrame {
  const viewScale = Math.max(rect.width / box.width, rect.height / box.height)
  const viewWidth = viewScale * box.width
  const viewHeight = viewScale * box.height
  const offset = box.offsetScale * viewScale
  return {
    viewScale,
    viewBox: {
      x: rect.x - (viewWidth - rect.width) / 2 - offset,
      y: rect.y - (viewHeight - rect.height) / 2 - offset,
      width: viewWidth + offset * 2,
      height: viewHeight + offset * 2,
    },
  }
}

export interface MiniMapPixelMapping {
  /** The flow point drawn at the top-left pixel of the box. */
  origin: XYPosition
  pixelsPerUnit: number
}

/**
 * How an SVG box shows a viewBox: one scale for both axes, fitted and
 * centered (`preserveAspectRatio="xMidYMid meet"`). The framing's margin is
 * the same on both axes, so its aspect ratio drifts from the box's and the
 * fitted axis decides the scale.
 */
export function mapViewBoxToBox(
  viewBox: Rect,
  box: MiniMapBox
): MiniMapPixelMapping {
  const pixelsPerUnit = Math.min(
    box.width / viewBox.width,
    box.height / viewBox.height
  )
  return {
    pixelsPerUnit,
    origin: {
      x: viewBox.x - (box.width / pixelsPerUnit - viewBox.width) / 2,
      y: viewBox.y - (box.height / pixelsPerUnit - viewBox.height) / 2,
    },
  }
}

export interface MiniMapLayoutInput {
  /** The box around the drawn nodes; `null` for an empty graph. */
  nodeBounds: Rect | null
  /** `frameRect(nodeBounds)`: the framing the node layer is drawn at. */
  nodeFrame: MiniMapFrame | null
  transform: Transform
  paneWidth: number
  paneHeight: number
  box: MiniMapBox
  /** The viewport frame's border width, in pixels. */
  strokeWidth: number
}

export interface MiniMapLayout {
  /** The part of the flow visible in the canvas, in flow units. */
  viewport: Rect
  /** The framing shown: the nodes and the viewport together. */
  frame: MiniMapFrame
  /** How `frame` lands on the box's pixels. */
  mapping: MiniMapPixelMapping
  /** Maps the node layer, drawn at the node framing, into `frame`. */
  nodesTransform: { x: number; y: number; scale: number } | null
  /** The viewport frame in pixels, its border straddling the viewport edge. */
  viewportBox: Rect
}

/**
 * Lays the mini map out for one viewport. Only compositor properties depend
 * on the result, so a pan frame never repaints the node layer.
 */
export function computeMiniMapLayout({
  nodeBounds,
  nodeFrame,
  transform,
  paneWidth,
  paneHeight,
  box,
  strokeWidth,
}: MiniMapLayoutInput): MiniMapLayout {
  const [translateX, translateY, zoom] = transform
  const viewport = {
    x: -translateX / zoom,
    y: -translateY / zoom,
    width: paneWidth / zoom,
    height: paneHeight / zoom,
  }
  const frame = frameRect(
    nodeBounds ? getBoundsOfRects(nodeBounds, viewport) : viewport,
    box
  )
  const mapping = mapViewBoxToBox(frame.viewBox, box)
  const { origin, pixelsPerUnit } = mapping
  const nodeMapping = nodeFrame ? mapViewBoxToBox(nodeFrame.viewBox, box) : null
  const nodesTransform = nodeMapping
    ? {
        x: (nodeMapping.origin.x - origin.x) * pixelsPerUnit,
        y: (nodeMapping.origin.y - origin.y) * pixelsPerUnit,
        scale: pixelsPerUnit / nodeMapping.pixelsPerUnit,
      }
    : null
  const viewportBox = {
    x: (viewport.x - origin.x) * pixelsPerUnit - strokeWidth / 2,
    y: (viewport.y - origin.y) * pixelsPerUnit - strokeWidth / 2,
    width: viewport.width * pixelsPerUnit + strokeWidth,
    height: viewport.height * pixelsPerUnit + strokeWidth,
  }

  return { viewport, frame, mapping, nodesTransform, viewportBox }
}

/** The flow position under a pixel offset inside the mini map. */
export function toFlowPosition(
  layout: MiniMapLayout,
  offsetX: number,
  offsetY: number
): XYPosition {
  const { origin, pixelsPerUnit } = layout.mapping
  return {
    x: origin.x + offsetX / pixelsPerUnit,
    y: origin.y + offsetY / pixelsPerUnit,
  }
}
