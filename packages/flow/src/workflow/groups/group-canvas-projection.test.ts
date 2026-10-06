import { describe, expect, it } from "vitest"

import type { WorkflowEdge, WorkflowGroup, WorkflowNode } from "../types/types"

import { toGroupFrameId } from "./group-canvas-ids"
import {
  buildCanvasEdges,
  GROUP_CARD_SOURCE_HANDLE,
  GROUP_CARD_TARGET_HANDLE,
} from "./group-canvas-edges"
import {
  createGroupCanvasNodeBuilder,
  getHiddenMemberIds,
  GROUP_CARD_NODE_TYPE,
  GROUP_FRAME_NODE_TYPE,
  GROUP_FRAME_Z_INDEX,
  hideCollapsedMembers,
} from "./group-canvas-nodes"
import { GROUP_CARD_HEIGHT, GROUP_CARD_WIDTH } from "./group-geometry"

function node(id: string, groupId?: string): WorkflowNode {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      kind: "result",
      label: id,
      config: {},
      ...(groupId ? { groupId } : {}),
    },
  }
}

function group(id: string, collapsed = false): WorkflowGroup {
  return {
    id,
    label: id.toUpperCase(),
    color: "green",
    x: 10,
    y: 20,
    width: 300,
    height: 200,
    collapsed,
  }
}

function edge(
  source: string,
  target: string,
  sourceHandle: string | null = null
): WorkflowEdge {
  return {
    id: `${source}-${target}-${sourceHandle ?? ""}`,
    source,
    target,
    sourceHandle,
    targetHandle: null,
    data: { sourceKind: "result", targetKind: "result" },
  }
}

const noOverride = new Map<string, boolean>()
const options = {
  collapsedOverride: noOverride,
  selectedGroupIds: new Set<string>(),
  editable: true,
}

describe("group canvas nodes", () => {
  it("draws an expanded group as a frame beneath nodes and edges", () => {
    const build = createGroupCanvasNodeBuilder()
    const [frame] = build([group("g")], [node("a", "g"), node("b")], options)
    expect(frame).toMatchObject({
      id: toGroupFrameId("g"),
      type: GROUP_FRAME_NODE_TYPE,
      position: { x: 10, y: 20 },
      width: 300,
      height: 200,
      zIndex: GROUP_FRAME_Z_INDEX,
      connectable: false,
      deletable: false,
      draggable: true,
      data: { groupId: "g", label: "G", memberIds: ["a"], collapsed: false },
    })
    // The whole frame drags and takes the pointer, not just its header.
    expect(frame?.dragHandle).toBeUndefined()
    expect(frame?.style?.pointerEvents).toBeUndefined()
  })

  it("draws a collapsed group as a card at its corner", () => {
    const build = createGroupCanvasNodeBuilder()
    const [card] = build([group("g", true)], [node("a", "g")], options)
    expect(card).toMatchObject({
      type: GROUP_CARD_NODE_TYPE,
      position: { x: 10, y: 20 },
      width: GROUP_CARD_WIDTH,
      height: GROUP_CARD_HEIGHT,
      data: { collapsed: true },
    })
  })

  it("follows the observe-mode override over the saved state", () => {
    const build = createGroupCanvasNodeBuilder()
    const [frame] = build([group("g", true)], [], {
      ...options,
      collapsedOverride: new Map([["g", false]]),
    })
    expect(frame?.type).toBe(GROUP_FRAME_NODE_TYPE)
  })

  it("is not draggable when the canvas is read-only", () => {
    const build = createGroupCanvasNodeBuilder()
    const [frame] = build([group("g")], [], { ...options, editable: false })
    expect(frame?.draggable).toBe(false)
  })

  it("marks selected groups and keeps a selected frame beneath nodes", () => {
    const build = createGroupCanvasNodeBuilder()
    const [frame] = build([group("g")], [], {
      ...options,
      selectedGroupIds: new Set(["g"]),
    })
    expect(frame?.selected).toBe(true)
    // React Flow adds 1000 to a selected node's z-index.
    expect((frame?.zIndex ?? 0) + 1000).toBeLessThan(0)
  })

  it("keeps a group's node identity while nothing about it changes", () => {
    const build = createGroupCanvasNodeBuilder()
    const groups = [group("g"), group("h")]
    const first = build(groups, [node("a", "g")], options)
    // Another node moved: a new node array, same membership.
    const second = build(groups, [node("a", "g"), node("z")], options)
    expect(second[0]).toBe(first[0])
    expect(second[1]).toBe(first[1])

    const third = build(groups, [node("a", "g"), node("b", "g")], options)
    expect(third[0]).not.toBe(first[0])
    expect(third[1]).toBe(first[1])
  })
})

describe("hidden members", () => {
  it("hides members of collapsed groups only", () => {
    const nodes = [node("a", "g"), node("b", "h"), node("c")]
    const hidden = getHiddenMemberIds(
      [group("g", true), group("h")],
      nodes,
      noOverride
    )
    expect([...hidden]).toEqual(["a"])

    const projected = hideCollapsedMembers(nodes, hidden)
    expect(projected.map((n) => Boolean(n.hidden))).toEqual([
      true,
      false,
      false,
    ])
    expect(projected[1]).toBe(nodes[1])
  })

  it("returns the same array when nothing is hidden", () => {
    const nodes = [node("a", "g")]
    expect(hideCollapsedMembers(nodes, new Set())).toBe(nodes)
  })
})

describe("buildCanvasEdges", () => {
  const nodes = [
    node("a", "g"),
    node("b", "g"),
    node("c", "h"),
    node("x"),
    node("y"),
  ]

  it("returns the same edges when nothing is collapsed", () => {
    const edges = [edge("a", "x")]
    expect(buildCanvasEdges(edges, nodes, [group("g")], noOverride)).toBe(edges)
  })

  it("omits edges inside one collapsed group", () => {
    const result = buildCanvasEdges(
      [edge("a", "b")],
      nodes,
      [group("g", true)],
      noOverride
    )
    expect(result).toEqual([])
  })

  it("redraws a boundary edge to the card as a read-only proxy", () => {
    const [proxy] = buildCanvasEdges(
      [edge("x", "a")],
      nodes,
      [group("g", true)],
      noOverride
    )
    expect(proxy).toMatchObject({
      source: "x",
      target: toGroupFrameId("g"),
      targetHandle: GROUP_CARD_TARGET_HANDLE,
      selectable: false,
      deletable: false,
    })
    expect(proxy?.id.startsWith("group-proxy:")).toBe(true)
  })

  it("joins two collapsed groups card to card", () => {
    const [proxy] = buildCanvasEdges(
      [edge("a", "c")],
      nodes,
      [group("g", true), group("h", true)],
      noOverride
    )
    expect(proxy).toMatchObject({
      source: toGroupFrameId("g"),
      sourceHandle: GROUP_CARD_SOURCE_HANDLE,
      target: toGroupFrameId("h"),
      targetHandle: GROUP_CARD_TARGET_HANDLE,
    })
  })

  it("merges proxies that join the same endpoints, branch handles included", () => {
    const result = buildCanvasEdges(
      [edge("a", "x", "true"), edge("b", "x", "false"), edge("a", "y")],
      nodes,
      [group("g", true)],
      noOverride
    )
    expect(result.map((e) => [e.source, e.target])).toEqual([
      [toGroupFrameId("g"), "x"],
      [toGroupFrameId("g"), "y"],
    ])
  })

  it("keeps unrelated edges unchanged", () => {
    const plain = edge("x", "y")
    const result = buildCanvasEdges(
      [plain],
      nodes,
      [group("g", true)],
      noOverride
    )
    expect(result[0]).toBe(plain)
  })

  it("honors the observe-mode override", () => {
    const edges = [edge("a", "b")]
    expect(
      buildCanvasEdges(
        edges,
        nodes,
        [group("g", true)],
        new Map([["g", false]])
      )
    ).toBe(edges)
  })
})
