import { describe, expect, it } from "vitest"

import {
  MINIMAP_FRAME_NODE_TYPE,
  buildMiniMapGeometry,
  type MiniMapSourceNode,
} from "./minimap-geometry"

function node(
  x: number,
  y: number,
  width: number | undefined,
  height: number | undefined,
  extra: Partial<MiniMapSourceNode> = {}
): MiniMapSourceNode {
  return {
    internals: { positionAbsolute: { x, y } },
    measured: { width, height },
    ...extra,
  }
}

/** The number of closed subpaths, one per drawn node. */
function countShapes(d: string): number {
  return d.split("Z").length - 1
}

describe("buildMiniMapGeometry", () => {
  it("draws nothing and has no bounds for an empty graph", () => {
    const geometry = buildMiniMapGeometry([])

    expect(geometry).toEqual({ nodesD: "", framesD: "", bounds: null })
  })

  it("draws every measured node as one rounded subpath", () => {
    const geometry = buildMiniMapGeometry([
      node(0, 0, 100, 50),
      node(200, 100, 80, 40),
    ])

    expect(countShapes(geometry.nodesD)).toBe(2)
    expect(geometry.nodesD.startsWith("M5 0")).toBe(true)
    expect(geometry.nodesD).toContain("a5 5 0 0 1")
    expect(geometry.framesD).toBe("")
  })

  it("skips hidden nodes", () => {
    const geometry = buildMiniMapGeometry([
      node(0, 0, 100, 50),
      node(500, 500, 100, 50, { hidden: true }),
    ])

    expect(countShapes(geometry.nodesD)).toBe(1)
    expect(geometry.bounds).toEqual({ x: 0, y: 0, width: 100, height: 50 })
  })

  it("skips nodes that have not been measured yet", () => {
    const geometry = buildMiniMapGeometry([
      node(0, 0, 100, 50),
      node(500, 500, undefined, undefined),
      node(600, 600, 100, 0),
    ])

    expect(countShapes(geometry.nodesD)).toBe(1)
    expect(geometry.bounds).toEqual({ x: 0, y: 0, width: 100, height: 50 })
  })

  it("draws group frames in their own layer", () => {
    const geometry = buildMiniMapGeometry([
      node(-20, -20, 400, 300, { type: MINIMAP_FRAME_NODE_TYPE }),
      node(0, 0, 100, 50),
    ])

    expect(countShapes(geometry.framesD)).toBe(1)
    expect(countShapes(geometry.nodesD)).toBe(1)
    expect(geometry.framesD.startsWith("M-15 -20")).toBe(true)
  })

  it("bounds cover every drawn node and frame", () => {
    const geometry = buildMiniMapGeometry([
      node(-20, 10, 100, 50, { type: MINIMAP_FRAME_NODE_TYPE }),
      node(0, -30, 100, 50),
      node(300, 200, 60, 40),
    ])

    expect(geometry.bounds).toEqual({ x: -20, y: -30, width: 380, height: 270 })
  })

  it("keeps the corner radius within a small node", () => {
    const geometry = buildMiniMapGeometry([node(0, 0, 6, 4)])

    expect(geometry.nodesD).toContain("a2 2 0 0 1")
  })
})
