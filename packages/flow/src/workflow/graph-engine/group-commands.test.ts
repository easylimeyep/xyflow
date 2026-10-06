import { describe, expect, it } from "vitest"

import {
  GROUP_FRAME_HEADER_HEIGHT,
  GROUP_FRAME_PADDING,
  GROUP_MIN_WIDTH,
} from "../groups/group-geometry"
import type {
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../types/types"

import {
  applyDeleteGroupsCommand,
  applyGroupNodesCommand,
  applyMoveGroupCommand,
  applyRecolorGroupCommand,
  applyRenameGroupCommand,
  applyResizeGroupCommand,
  applySetGroupCollapsedCommand,
  applyUngroupCommand,
} from "./group-commands"

function node(
  id: string,
  x: number,
  y: number,
  groupId?: string,
  selected = false
): WorkflowNode {
  return {
    id,
    type: "result",
    position: { x, y },
    measured: { width: 100, height: 50 },
    selected,
    data: {
      kind: "result",
      label: id,
      config: { category: "true" },
      ...(groupId ? { groupId } : {}),
    },
  }
}

function edge(source: string, target: string): WorkflowEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    data: { sourceKind: "result", targetKind: "result" },
  }
}

function group(overrides: Partial<WorkflowGroup> = {}): WorkflowGroup {
  return {
    id: "g1",
    label: "Group 1",
    color: "blue",
    x: 0,
    y: 0,
    width: 500,
    height: 400,
    collapsed: false,
    ...overrides,
  }
}

function graph(
  nodes: WorkflowNode[],
  groups: WorkflowGroup[] = [],
  edges: WorkflowEdge[] = []
): WorkflowGraphState {
  return {
    nodes,
    edges,
    groups,
    viewport: { x: 0, y: 0, zoom: 1 },
    document: { id: "d", name: "d", version: 1, metadata: {} },
  }
}

function success<T extends { ok: boolean }>(result: T) {
  if (!result.ok) {
    throw new Error("expected the command to succeed")
  }
  return result as Extract<T, { ok: true }>
}

describe("applyGroupNodesCommand", () => {
  it("groups ungrouped nodes into a fitted frame with default label and color", () => {
    const result = success(
      applyGroupNodesCommand(
        graph([node("a", 0, 0), node("b", 200, 100), node("c", 900, 900)]),
        { nodeIds: ["a", "b"], groupId: "new" }
      )
    )

    expect(result.groupId).toBe("new")
    expect(result.nextGraph.groups).toEqual([
      {
        id: "new",
        label: "Group 1",
        color: "blue",
        x: -GROUP_FRAME_PADDING,
        y: -GROUP_FRAME_PADDING - GROUP_FRAME_HEADER_HEIGHT,
        width: 300 + 2 * GROUP_FRAME_PADDING,
        height: 150 + 2 * GROUP_FRAME_PADDING + GROUP_FRAME_HEADER_HEIGHT,
        collapsed: false,
      },
    ])
    expect(result.nextGraph.nodes.map((n) => [n.id, n.data.groupId])).toEqual([
      ["a", "new"],
      ["b", "new"],
      ["c", undefined],
    ])
  })

  it("groups a single node", () => {
    const result = applyGroupNodesCommand(graph([node("a", 0, 0)]), {
      nodeIds: ["a"],
    })
    expect(result.ok).toBe(true)
  })

  it("picks a label unique among existing groups", () => {
    const result = success(
      applyGroupNodesCommand(
        graph(
          [node("a", 0, 0)],
          [
            group({ id: "x", label: "Group 1" }),
            group({ id: "y", label: "Group 3" }),
          ]
        ),
        { nodeIds: ["a"] }
      )
    )
    expect(result.nextGraph.groups.at(-1)?.label).toBe("Group 2")
  })

  it("rejects a selection that contains a grouped node", () => {
    const result = applyGroupNodesCommand(
      graph([node("a", 0, 0, "g1"), node("b", 0, 0)], [group()]),
      { nodeIds: ["a", "b"] }
    )
    expect(result.ok).toBe(false)
  })

  it("rejects an empty or unknown selection", () => {
    expect(applyGroupNodesCommand(graph([]), { nodeIds: [] }).ok).toBe(false)
    expect(
      applyGroupNodesCommand(graph([node("a", 0, 0)]), { nodeIds: ["zzz"] }).ok
    ).toBe(false)
  })
})

describe("applyUngroupCommand", () => {
  it("removes the group and keeps members in place without a group", () => {
    const before = graph(
      [node("a", 10, 20, "g1"), node("b", 30, 40, "g1"), node("c", 0, 0)],
      [group()]
    )
    const result = success(applyUngroupCommand(before, { groupId: "g1" }))

    expect(result.nextGraph.groups).toEqual([])
    expect(result.nextGraph.nodes.map((n) => n.position)).toEqual(
      before.nodes.map((n) => n.position)
    )
    expect(result.nextGraph.nodes.every((n) => !("groupId" in n.data))).toBe(
      true
    )
  })

  it("fails for an unknown group", () => {
    expect(applyUngroupCommand(graph([]), { groupId: "nope" }).ok).toBe(false)
  })
})

describe("applyDeleteGroupsCommand", () => {
  it("removes groups with their members and the members' edges", () => {
    const result = success(
      applyDeleteGroupsCommand(
        graph(
          [node("a", 0, 0, "g1"), node("b", 0, 0, "g1"), node("c", 0, 0)],
          [group(), group({ id: "g2" })],
          [edge("a", "b"), edge("b", "c"), edge("c", "c")]
        ),
        { groupIds: ["g1"] }
      )
    )

    expect(result.nextGraph.groups.map((g) => g.id)).toEqual(["g2"])
    expect(result.nextGraph.nodes.map((n) => n.id)).toEqual(["c"])
    expect(result.nextGraph.edges.map((e) => e.id)).toEqual(["c-c"])
    expect([...result.removedNodeIds].sort()).toEqual(["a", "b"])
  })
})

describe("applyRenameGroupCommand", () => {
  it("renames with a trimmed label", () => {
    const result = success(
      applyRenameGroupCommand(graph([], [group()]), {
        groupId: "g1",
        label: "  Parse response ",
      })
    )
    expect(result.nextGraph.groups[0]?.label).toBe("Parse response")
  })

  it("rejects an empty label", () => {
    expect(
      applyRenameGroupCommand(graph([], [group()]), {
        groupId: "g1",
        label: "   ",
      }).ok
    ).toBe(false)
  })

  it("returns the same graph when nothing changes", () => {
    const before = graph([], [group()])
    expect(
      success(
        applyRenameGroupCommand(before, { groupId: "g1", label: "Group 1" })
      ).nextGraph
    ).toBe(before)
  })
})

describe("applyRecolorGroupCommand", () => {
  it("changes the color token", () => {
    const result = success(
      applyRecolorGroupCommand(graph([], [group()]), {
        groupId: "g1",
        color: "green",
      })
    )
    expect(result.nextGraph.groups[0]?.color).toBe("green")
  })
})

describe("applyResizeGroupCommand", () => {
  it("clamps the new rectangle to the members", () => {
    const result = success(
      applyResizeGroupCommand(graph([node("a", 100, 100, "g1")], [group()]), {
        groupId: "g1",
        rect: { x: 0, y: 0, width: 10, height: 400 },
      })
    )
    expect(result.nextGraph.groups[0]?.width).toBe(
      100 + 100 + GROUP_FRAME_PADDING
    )
  })

  it("keeps an empty group at least the minimum size", () => {
    const result = success(
      applyResizeGroupCommand(graph([], [group()]), {
        groupId: "g1",
        rect: { x: 0, y: 0, width: 10, height: 10 },
      })
    )
    expect(result.nextGraph.groups[0]?.width).toBe(GROUP_MIN_WIDTH)
  })
})

describe("applySetGroupCollapsedCommand", () => {
  it("collapses and deselects members", () => {
    const result = success(
      applySetGroupCollapsedCommand(
        graph(
          [node("a", 0, 0, "g1", true), node("b", 0, 0, undefined, true)],
          [group()]
        ),
        { groupId: "g1", collapsed: true }
      )
    )
    expect(result.nextGraph.groups[0]?.collapsed).toBe(true)
    expect(result.nextGraph.nodes.map((n) => n.selected)).toEqual([false, true])
  })

  it("expands without changing the rectangle", () => {
    const before = graph([], [group({ collapsed: true })])
    const result = success(
      applySetGroupCollapsedCommand(before, { groupId: "g1", collapsed: false })
    )
    expect(result.nextGraph.groups[0]).toEqual({
      ...before.groups[0],
      collapsed: false,
    })
  })
})

describe("applyMoveGroupCommand", () => {
  it("moves the rectangle and every member, but not other nodes", () => {
    const result = success(
      applyMoveGroupCommand(
        graph([node("a", 10, 10, "g1"), node("b", 0, 0)], [group()]),
        { groupId: "g1", dx: 5, dy: -7 }
      )
    )
    expect(result.nextGraph.groups[0]).toMatchObject({ x: 5, y: -7 })
    expect(result.nextGraph.nodes.map((n) => n.position)).toEqual([
      { x: 15, y: 3 },
      { x: 0, y: 0 },
    ])
  })
})
