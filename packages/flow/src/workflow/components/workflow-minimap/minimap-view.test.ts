import type { Rect } from "@xyflow/react"
import { describe, expect, it } from "vitest"

import {
  computeMiniMapLayout,
  frameRect,
  mapViewBoxToBox,
  toFlowPosition,
  type MiniMapBox,
} from "./minimap-view"

const BOX: MiniMapBox = { width: 200, height: 150, offsetScale: 5 }
const STROKE = 2

/** React Flow's `MiniMap` framing, restated for the same inputs. */
function reactFlowFrame(bounding: Rect) {
  const viewScale = Math.max(
    bounding.width / BOX.width,
    bounding.height / BOX.height
  )
  const viewWidth = viewScale * BOX.width
  const viewHeight = viewScale * BOX.height
  const offset = BOX.offsetScale * viewScale
  return {
    viewScale,
    viewBox: {
      x: bounding.x - (viewWidth - bounding.width) / 2 - offset,
      y: bounding.y - (viewHeight - bounding.height) / 2 - offset,
      width: viewWidth + offset * 2,
      height: viewHeight + offset * 2,
    },
  }
}

function layout(nodeBounds: Rect | null, transform: [number, number, number]) {
  return computeMiniMapLayout({
    nodeBounds,
    nodeFrame: nodeBounds ? frameRect(nodeBounds, BOX) : null,
    transform,
    paneWidth: 800,
    paneHeight: 600,
    box: BOX,
    strokeWidth: STROKE,
  })
}

describe("frameRect", () => {
  it("frames a rectangle like React Flow's mini map", () => {
    const rect = { x: -500, y: 200, width: 3000, height: 400 }

    expect(frameRect(rect, BOX)).toEqual(reactFlowFrame(rect))
  })
})

describe("mapViewBoxToBox", () => {
  it("fits the tighter axis and centers the other, like an SVG with meet", () => {
    // Wider than the box's 4:3, so the width decides the scale.
    const mapping = mapViewBoxToBox(
      { x: 0, y: 0, width: 400, height: 200 },
      BOX
    )

    expect(mapping.pixelsPerUnit).toBe(0.5)
    expect(mapping.origin).toEqual({ x: 0, y: -50 })
  })

  it("lets the height decide for a taller viewBox", () => {
    const mapping = mapViewBoxToBox(
      { x: 10, y: 0, width: 100, height: 300 },
      BOX
    )

    expect(mapping.pixelsPerUnit).toBe(0.5)
    expect(mapping.origin).toEqual({ x: -140, y: 0 })
  })
})

describe("computeMiniMapLayout", () => {
  it("reads the viewport rectangle from the transform", () => {
    expect(layout(null, [-100, -50, 2]).viewport).toEqual({
      x: 50,
      y: 25,
      width: 400,
      height: 300,
    })
  })

  it("frames only the viewport when there are no nodes", () => {
    const result = layout(null, [0, 0, 1])

    expect(result.frame).toEqual(
      reactFlowFrame({ x: 0, y: 0, width: 800, height: 600 })
    )
    expect(result.nodesTransform).toBeNull()
  })

  it("frames the union of the nodes and the viewport like React Flow", () => {
    const result = layout(
      { x: -500, y: 200, width: 3000, height: 400 },
      [0, 0, 1]
    )

    expect(result.frame).toEqual(
      reactFlowFrame({ x: -500, y: 0, width: 3000, height: 600 })
    )
  })

  it("maps a flow point drawn in the node layer to its pixel in the view", () => {
    const nodeBounds = { x: 0, y: 0, width: 1000, height: 5000 }
    const result = layout(nodeBounds, [3000, 200, 0.1])
    const nodeMapping = mapViewBoxToBox(frameRect(nodeBounds, BOX).viewBox, BOX)
    const { origin, pixelsPerUnit } = result.mapping
    const point = { x: 640, y: 3210 }
    const { x, y, scale } = result.nodesTransform!

    const shownX =
      (point.x - nodeMapping.origin.x) * nodeMapping.pixelsPerUnit * scale + x
    const shownY =
      (point.y - nodeMapping.origin.y) * nodeMapping.pixelsPerUnit * scale + y

    expect(shownX).toBeCloseTo((point.x - origin.x) * pixelsPerUnit)
    expect(shownY).toBeCloseTo((point.y - origin.y) * pixelsPerUnit)
    expect(scale).toBeLessThanOrEqual(1)
  })

  it("places the viewport frame so its border straddles the viewport edge", () => {
    const result = layout(
      { x: 0, y: 0, width: 4000, height: 3000 },
      [-400, -300, 1]
    )
    const { origin, pixelsPerUnit: k } = result.mapping

    expect(result.viewportBox).toEqual({
      x: (400 - origin.x) * k - STROKE / 2,
      y: (300 - origin.y) * k - STROKE / 2,
      width: 800 * k + STROKE,
      height: 600 * k + STROKE,
    })
  })
})

describe("toFlowPosition", () => {
  it("turns a pixel offset inside the mini map into a flow position", () => {
    const result = layout({ x: 0, y: 0, width: 4000, height: 3000 }, [0, 0, 1])

    const { origin, pixelsPerUnit } = result.mapping

    expect(toFlowPosition(result, 50, 30)).toEqual({
      x: origin.x + 50 / pixelsPerUnit,
      y: origin.y + 30 / pixelsPerUnit,
    })
  })
})
