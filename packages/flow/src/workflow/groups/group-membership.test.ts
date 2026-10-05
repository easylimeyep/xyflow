import { describe, expect, it } from "vitest"

import type {
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../types/types"

import { GROUP_FRAME_PADDING } from "./group-geometry"
import {
  previewGroupGrowth,
  resolveMembershipAfterDrag,
} from "./group-membership"

/** A 100 × 50 node, so its center is (x + 50, y + 25). */
function node(
  id: string,
  x: number,
  y: number,
  groupId?: string
): WorkflowNode {
  return {
    id,
    type: "result",
    position: { x, y },
    measured: { width: 100, height: 50 },
    data: {
      kind: "result",
      label: id,
      config: { category: "true" },
      ...(groupId ? { groupId } : {}),
    },
  }
}

function group(
  id: string,
  rect: { x: number; y: number; width: number; height: number },
  collapsed = false
): WorkflowGroup {
  return { id, label: id, color: "blue", collapsed, ...rect }
}

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

const A = group("A", { x: 0, y: 0, width: 400, height: 400 })
const B = group("B", { x: 1000, y: 0, width: 400, height: 400 })

function groupOf(result: WorkflowGraphState, nodeId: string) {
  return result.nodes.find((n) => n.id === nodeId)?.data.groupId
}

describe("resolveMembershipAfterDrag", () => {
  it("joins the group whose frame contains the node's center", () => {
    const result = resolveMembershipAfterDrag(
      graph([node("n", 100, 100)], [A]),
      ["n"]
    )
    expect(groupOf(result, "n")).toBe("A")
  })

  it("leaves the group when the center is outside its frame", () => {
    const result = resolveMembershipAfterDrag(
      graph([node("n", 600, 100, "A")], [A]),
      ["n"]
    )
    expect(groupOf(result, "n")).toBeUndefined()
    expect(result.groups).toEqual([A])
  })

  it("moves between groups", () => {
    const result = resolveMembershipAfterDrag(
      graph([node("n", 1100, 100, "A")], [A, B]),
      ["n"]
    )
    expect(groupOf(result, "n")).toBe("B")
  })

  it("picks the smallest frame when several contain the center", () => {
    const small = group("S", { x: 50, y: 50, width: 200, height: 200 })
    const result = resolveMembershipAfterDrag(
      graph([node("n", 100, 100)], [A, small]),
      ["n"]
    )
    expect(groupOf(result, "n")).toBe("S")
  })

  it("ignores collapsed groups", () => {
    const folded = group("F", { x: 0, y: 0, width: 400, height: 400 }, true)
    const result = resolveMembershipAfterDrag(
      graph([node("n", 100, 100)], [folded]),
      ["n"]
    )
    expect(groupOf(result, "n")).toBeUndefined()
  })

  it("grows the target frame to enclose a member near its edge", () => {
    const result = resolveMembershipAfterDrag(
      graph([node("n", 320, 100, "A")], [A]),
      ["n"]
    )
    expect(groupOf(result, "n")).toBe("A")
    expect(result.groups[0]?.width).toBe(320 + 100 + GROUP_FRAME_PADDING)
  })

  it("judges containment against the frames from before the drag", () => {
    // During the drag the frame grew to follow a member; another member that
    // ended outside the original frame still leaves.
    const grownA = { ...A, width: 900 }
    const result = resolveMembershipAfterDrag(
      graph([node("n", 600, 100, "A")], [grownA]),
      ["n"],
      [A]
    )
    expect(groupOf(result, "n")).toBeUndefined()
    expect(result.groups[0]).toEqual(A)
  })

  it("returns the same graph when nothing changes", () => {
    const before = graph([node("n", 100, 100, "A")], [A])
    expect(resolveMembershipAfterDrag(before, ["n"])).toBe(before)
  })

  it("does not touch nodes that were not dragged", () => {
    const before = graph([node("n", 100, 100), node("m", 100, 100)], [A])
    const result = resolveMembershipAfterDrag(before, ["n"])
    expect(groupOf(result, "m")).toBeUndefined()
  })
})

describe("previewGroupGrowth", () => {
  it("grows a frame to follow a member whose center is still inside", () => {
    const result = previewGroupGrowth(
      graph([node("n", 340, 100, "A")], [A]),
      ["n"],
      [A]
    )
    expect(result.groups[0]?.width).toBe(340 + 100 + GROUP_FRAME_PADDING)
  })

  it("does not follow a member whose center has left the frame", () => {
    const before = graph([node("n", 600, 100, "A")], [A])
    expect(previewGroupGrowth(before, ["n"], [A])).toBe(before)
  })

  it("restores the original rectangle when the member moves back", () => {
    const grown = { ...A, width: 600 }
    const result = previewGroupGrowth(
      graph([node("n", 100, 100, "A")], [grown]),
      ["n"],
      [A]
    )
    expect(result.groups[0]).toEqual(A)
  })
})
