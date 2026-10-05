import { describe, expect, it } from "vitest"

import { DEFAULT_NODE_WIDTH } from "../node-registry/node-factory"
import { getEstimatedNodeHeight } from "../layout/node-size-estimate"
import type {
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../types/types"

import {
  clampResize,
  clearDanglingGroupIds,
  fitToContents,
  getCollapsedCardRect,
  getGroupMembers,
  getMemberBounds,
  GROUP_CARD_HEIGHT,
  GROUP_CARD_WIDTH,
  GROUP_FRAME_HEADER_HEIGHT,
  GROUP_FRAME_PADDING,
  GROUP_MIN_HEIGHT,
  GROUP_MIN_WIDTH,
  growToFit,
} from "./group-geometry"

function node(
  id: string,
  x: number,
  y: number,
  size: { width: number; height: number } | null = { width: 100, height: 50 },
  groupId?: string
): WorkflowNode {
  return {
    id,
    type: "result",
    position: { x, y },
    ...(size ? { measured: size } : {}),
    data: {
      kind: "result",
      label: id,
      config: { category: "true" },
      ...(groupId ? { groupId } : {}),
    },
  }
}

function group(overrides: Partial<WorkflowGroup> = {}): WorkflowGroup {
  return {
    id: "g1",
    label: "Group 1",
    color: "blue",
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    collapsed: false,
    ...overrides,
  }
}

/** The frame that exactly fits members spanning [x1, x2] × [y1, y2]. */
function fitted(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: x1 - GROUP_FRAME_PADDING,
    y: y1 - GROUP_FRAME_PADDING - GROUP_FRAME_HEADER_HEIGHT,
    width: x2 - x1 + 2 * GROUP_FRAME_PADDING,
    height: y2 - y1 + 2 * GROUP_FRAME_PADDING + GROUP_FRAME_HEADER_HEIGHT,
  }
}

describe("getMemberBounds", () => {
  it("returns null for no members", () => {
    expect(getMemberBounds([])).toBeNull()
  })

  it("encloses measured members", () => {
    expect(getMemberBounds([node("a", 10, 20), node("b", 200, 100)])).toEqual({
      x: 10,
      y: 20,
      width: 290,
      height: 130,
    })
  })

  it("falls back to the default width and the estimated height for unmeasured nodes", () => {
    const unmeasured = node("a", 0, 0, null)
    expect(getMemberBounds([unmeasured])).toEqual({
      x: 0,
      y: 0,
      width: DEFAULT_NODE_WIDTH,
      height: getEstimatedNodeHeight(unmeasured),
    })
  })
})

describe("growToFit", () => {
  it("grows the frame to enclose a member past its right edge", () => {
    const g = group({ x: 0, y: 0, width: 300, height: 300 })
    const grown = growToFit(g, [node("a", 400, 100)])
    expect(grown.x).toBe(0)
    expect(grown.y).toBe(0)
    expect(grown.width).toBe(400 + 100 + GROUP_FRAME_PADDING)
    expect(grown.height).toBe(300)
  })

  it("grows up and left as well", () => {
    const g = group({ x: 0, y: 0, width: 300, height: 300 })
    const grown = growToFit(g, [node("a", -50, 0)])
    const fit = fitted(-50, 0, 50, 50)
    expect(grown.x).toBe(fit.x)
    expect(grown.y).toBe(fit.y)
    expect(grown.x + grown.width).toBe(300)
    expect(grown.y + grown.height).toBe(300)
  })

  it("never shrinks and keeps identity when members already fit", () => {
    const g = group({ x: -100, y: -100, width: 1000, height: 1000 })
    expect(growToFit(g, [node("a", 100, 100)])).toBe(g)
  })

  it("keeps an empty group unchanged", () => {
    const g = group()
    expect(growToFit(g, [])).toBe(g)
  })
})

describe("fitToContents", () => {
  it("fits a larger frame exactly around its members", () => {
    const g = group({ x: -500, y: -500, width: 2000, height: 2000 })
    const fit = fitToContents(g, [node("a", 0, 0), node("b", 200, 100)])
    expect(fit).toMatchObject(fitted(0, 0, 300, 150))
  })

  it("keeps an empty group unchanged", () => {
    const g = group()
    expect(fitToContents(g, [])).toBe(g)
  })
})

describe("clampResize", () => {
  it("stops an inward edge at the member bounds plus padding", () => {
    const g = group({ x: 0, y: 0, width: 600, height: 400 })
    const members = [node("a", 100, 100)]
    const resized = clampResize(g, members, {
      x: 0,
      y: 0,
      width: 150,
      height: 400,
    })
    expect(resized.x).toBe(0)
    expect(resized.width).toBe(100 + 100 + GROUP_FRAME_PADDING)
  })

  it("keeps the right edge fixed when the left edge hits the members", () => {
    const g = group({ x: 0, y: 0, width: 600, height: 400 })
    const members = [node("a", 100, 100)]
    const resized = clampResize(g, members, {
      x: 300,
      y: 0,
      width: 300,
      height: 400,
    })
    expect(resized.x).toBe(100 - GROUP_FRAME_PADDING)
    expect(resized.x + resized.width).toBe(600)
  })

  it("keeps the bottom edge fixed when the top edge hits the header", () => {
    const g = group({ x: 0, y: 0, width: 600, height: 400 })
    const members = [node("a", 100, 100)]
    const resized = clampResize(g, members, {
      x: 0,
      y: 200,
      width: 600,
      height: 200,
    })
    expect(resized.y).toBe(
      100 - GROUP_FRAME_PADDING - GROUP_FRAME_HEADER_HEIGHT
    )
    expect(resized.y + resized.height).toBe(400)
  })

  it("leaves the edge not being dragged alone when the frame does not enclose its members", () => {
    // The member sticks out on the left; dragging the right edge must not
    // snap the left edge out to it.
    const g = group({ x: 200, y: 0, width: 400, height: 400 })
    const resized = clampResize(g, [node("a", 100, 100)], {
      x: 200,
      y: 0,
      width: 500,
      height: 400,
    })
    expect(resized.x).toBe(200)
    expect(resized.width).toBe(500)
  })

  it("allows growing freely", () => {
    const g = group({ x: 0, y: 0, width: 600, height: 400 })
    const resized = clampResize(g, [node("a", 100, 100)], {
      x: -100,
      y: -100,
      width: 900,
      height: 700,
    })
    expect(resized).toMatchObject({ x: -100, y: -100, width: 900, height: 700 })
  })

  it("stops an empty group at the minimum size, anchored on the opposite edge", () => {
    const g = group({ x: 0, y: 0, width: 600, height: 400 })
    const fromRight = clampResize(g, [], { x: 0, y: 0, width: 10, height: 10 })
    expect(fromRight).toMatchObject({
      x: 0,
      y: 0,
      width: GROUP_MIN_WIDTH,
      height: GROUP_MIN_HEIGHT,
    })

    const fromLeft = clampResize(g, [], {
      x: 590,
      y: 390,
      width: 10,
      height: 10,
    })
    expect(fromLeft).toMatchObject({
      x: 600 - GROUP_MIN_WIDTH,
      y: 400 - GROUP_MIN_HEIGHT,
      width: GROUP_MIN_WIDTH,
      height: GROUP_MIN_HEIGHT,
    })
  })
})

describe("getCollapsedCardRect", () => {
  it("places a fixed-size card at the group's position", () => {
    expect(getCollapsedCardRect(group({ x: 10, y: 20 }))).toEqual({
      x: 10,
      y: 20,
      width: GROUP_CARD_WIDTH,
      height: GROUP_CARD_HEIGHT,
    })
  })
})

describe("getGroupMembers", () => {
  it("returns the nodes whose groupId matches", () => {
    const nodes = [
      node("a", 0, 0, undefined, "g1"),
      node("b", 0, 0),
      node("c", 0, 0, undefined, "g2"),
    ]
    expect(getGroupMembers("g1", nodes).map((n) => n.id)).toEqual(["a"])
  })
})

describe("clearDanglingGroupIds", () => {
  function graph(
    nodes: WorkflowNode[],
    groups: WorkflowGroup[]
  ): WorkflowGraphState {
    return {
      nodes,
      edges: [],
      groups,
      viewport: { x: 0, y: 0, zoom: 1 },
      document: { id: "d", name: "d", version: 1, metadata: {} },
    }
  }

  it("clears a groupId that points to a missing group", () => {
    const result = clearDanglingGroupIds(
      graph(
        [node("a", 0, 0, undefined, "gone"), node("b", 0, 0, undefined, "g1")],
        [group()]
      )
    )
    expect(result.nodes[0]?.data.groupId).toBeUndefined()
    expect("groupId" in (result.nodes[0]?.data ?? {})).toBe(false)
    expect(result.nodes[1]?.data.groupId).toBe("g1")
  })

  it("returns the same graph when nothing dangles", () => {
    const g = graph([node("a", 0, 0, undefined, "g1")], [group()])
    expect(clearDanglingGroupIds(g)).toBe(g)
  })

  it("keeps empty groups", () => {
    const g = graph([], [group()])
    expect(clearDanglingGroupIds(g).groups).toHaveLength(1)
  })
})
