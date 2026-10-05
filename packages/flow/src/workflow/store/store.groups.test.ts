// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

import { toGroupFrameId } from "../groups/group-canvas-ids"
import { GROUP_FRAME_PADDING } from "../groups/group-geometry"
import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import type {
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../types/types"

import { createWorkflowStore } from "./store"

/** A measured 100 × 50 result node, so its center is (x + 50, y + 25). */
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

function edge(source: string, target: string): WorkflowEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    data: { sourceKind: "result", targetKind: "result" },
  }
}

function group(id: string, rect: Partial<WorkflowGroup> = {}): WorkflowGroup {
  return {
    id,
    label: id,
    color: "blue",
    x: 0,
    y: 0,
    width: 400,
    height: 400,
    collapsed: false,
    ...rect,
  }
}

function createStore(
  nodes: WorkflowNode[],
  groups: WorkflowGroup[] = [],
  edges: WorkflowEdge[] = []
) {
  const initialGraph: WorkflowGraphState = {
    nodes,
    edges,
    groups,
    viewport: { x: 0, y: 0, zoom: 1 },
    document: { id: "d", name: "d", version: 1, metadata: {} },
  }
  return createWorkflowStore({
    definitions: builtinBaseDefinitions,
    initialGraph,
  })
}

type Store = ReturnType<typeof createStore>

function pasts(store: Store) {
  return store.history.getState().pasts.length
}

function groupOf(store: Store, nodeId: string) {
  return store.getState().graph.nodes.find((n) => n.id === nodeId)?.data.groupId
}

/** Drags canvas node `id` through `positions`, then drops it at the last one. */
function drag(
  store: Store,
  id: string,
  positions: Array<{ x: number; y: number }>
) {
  positions.forEach((position) =>
    store
      .getState()
      .onNodesChange([{ id, type: "position", position, dragging: true }])
  )
  const last = positions.at(-1)!
  store
    .getState()
    .onNodesChange([{ id, type: "position", position: last, dragging: false }])
}

describe("group store actions", () => {
  it("groups the selection in one step and selects the new group", () => {
    const store = createStore([node("a", 0, 0), node("b", 200, 0)])
    store.getState().setSelectedNodes(["a", "b"])
    const before = pasts(store)

    const groupId = store.getState().groupNodes()

    expect(groupId).not.toBeNull()
    expect(pasts(store)).toBe(before + 1)
    expect(store.getState().selectedGroupIds).toEqual([groupId])
    expect(store.getState().selectedNodeIds).toEqual([])
    expect(groupOf(store, "a")).toBe(groupId)

    store.getState().undo()
    expect(store.getState().graph.groups).toEqual([])
    expect(groupOf(store, "a")).toBeUndefined()
    expect(store.getState().selectedGroupIds).toEqual([])
  })

  it("refuses to group a selection containing a grouped node", () => {
    const store = createStore(
      [node("a", 0, 0, "g"), node("b", 0, 0)],
      [group("g")]
    )
    expect(store.getState().groupNodes(["a", "b"])).toBeNull()
    expect(store.getState().lastError?.code).toBe("INVALID_GROUP_SELECTION")
  })

  it("ungroups the selected group in one step", () => {
    const store = createStore([node("a", 10, 10, "g")], [group("g")])
    store.getState().setSelectedGroups(["g"])
    const before = pasts(store)

    expect(store.getState().ungroup()).toBe(true)
    expect(pasts(store)).toBe(before + 1)
    expect(store.getState().graph.groups).toEqual([])
    expect(store.getState().graph.nodes[0]?.position).toEqual({ x: 10, y: 10 })
    expect(store.getState().selectedGroupIds).toEqual([])
  })

  it.each([
    ["rename", (s: Store) => s.getState().renameGroup("g", "Parse")],
    ["recolor", (s: Store) => s.getState().recolorGroup("g", "green")],
    [
      "resize",
      (s: Store) =>
        s.getState().resizeGroup("g", { x: 0, y: 0, width: 600, height: 500 }),
    ],
    ["fit", (s: Store) => s.getState().fitGroupToContents("g")],
    ["collapse", (s: Store) => s.getState().setGroupCollapsed("g", true)],
  ])("%s commits exactly one history step", (_name, act) => {
    const store = createStore([node("a", 100, 100, "g")], [group("g")])
    const before = pasts(store)
    act(store)
    expect(pasts(store)).toBe(before + 1)
  })

  it("rejects an empty rename and keeps the label", () => {
    const store = createStore([], [group("g", { label: "Keep" })])
    const before = pasts(store)
    expect(store.getState().renameGroup("g", "  ")).toBe(false)
    expect(store.getState().graph.groups[0]?.label).toBe("Keep")
    expect(pasts(store)).toBe(before)
  })

  it("collapsing deselects members; undo expands again", () => {
    const store = createStore(
      [node("a", 100, 100, "g"), node("b", 600, 100)],
      [group("g")]
    )
    store.getState().setSelectedNodes(["a", "b"])

    store.getState().setGroupCollapsed("g", true)
    expect(store.getState().selectedNodeIds).toEqual(["b"])
    expect(
      store.getState().graph.nodes.find((n) => n.id === "a")?.selected
    ).toBe(false)

    store.getState().undo()
    expect(store.getState().graph.groups[0]?.collapsed).toBe(false)
  })

  it("deleting the last member keeps the empty group", () => {
    const store = createStore([node("a", 100, 100, "g")], [group("g")])
    store.getState().deleteNodes(["a"])
    expect(store.getState().graph.groups).toHaveLength(1)
  })

  it("deleting a group removes members and edges; one undo restores everything", () => {
    const store = createStore(
      [node("a", 100, 100, "g"), node("b", 200, 100, "g"), node("c", 900, 0)],
      [group("g")],
      [edge("a", "b"), edge("b", "c")]
    )
    store.getState().setSelectedGroups(["g"])
    const snapshot = store.getState().graph

    expect(store.getState().deleteSelection()).toBe(true)
    expect(store.getState().graph.nodes.map((n) => n.id)).toEqual(["c"])
    expect(store.getState().graph.edges).toEqual([])
    expect(store.getState().graph.groups).toEqual([])

    store.getState().undo()
    expect(store.getState().graph.nodes.map((n) => n.id)).toEqual(
      snapshot.nodes.map((n) => n.id)
    )
    expect(store.getState().graph.edges).toEqual(snapshot.edges)
    expect(store.getState().graph.groups).toEqual(snapshot.groups)
  })

  it("delete with a group and one of its members selected removes the whole group in one step", () => {
    const store = createStore(
      [node("a", 100, 100, "g"), node("b", 200, 100, "g"), node("c", 900, 0)],
      [group("g")]
    )
    store.getState().setSelectedGroups(["g"])
    store.getState().setSelectedNodes(["a", "c"])
    const before = pasts(store)

    store.getState().deleteSelection()

    expect(store.getState().graph.nodes).toEqual([])
    expect(store.getState().graph.groups).toEqual([])
    expect(pasts(store)).toBe(before + 1)
  })
})

describe("dragging groups", () => {
  it("dragging a header moves the group and members in one undo step", () => {
    const store = createStore(
      [node("a", 100, 100, "g"), node("other", 900, 900)],
      [group("g")]
    )
    const before = pasts(store)

    drag(store, toGroupFrameId("g"), [
      { x: 10, y: 10 },
      { x: 50, y: 30 },
    ])

    expect(store.getState().graph.groups[0]).toMatchObject({ x: 50, y: 30 })
    expect(store.getState().graph.nodes.map((n) => n.position)).toEqual([
      { x: 150, y: 130 },
      { x: 900, y: 900 },
    ])
    expect(pasts(store)).toBe(before + 1)

    store.getState().undo()
    expect(store.getState().graph.groups[0]).toMatchObject({ x: 0, y: 0 })
    expect(store.getState().graph.nodes[0]?.position).toEqual({
      x: 100,
      y: 100,
    })
  })

  it("undo restores an empty group moved by its header", () => {
    const store = createStore([], [group("g")])
    drag(store, toGroupFrameId("g"), [{ x: 80, y: 40 }])
    expect(store.getState().graph.groups[0]).toMatchObject({ x: 80, y: 40 })

    store.getState().undo()
    expect(store.getState().graph.groups[0]).toMatchObject({ x: 0, y: 0 })
  })

  it("a selected member of a dragged group moves once", () => {
    const store = createStore([node("a", 100, 100, "g")], [group("g")])
    store.getState().onNodesChange([
      {
        id: toGroupFrameId("g"),
        type: "position",
        position: { x: 20, y: 0 },
        dragging: true,
      },
      {
        id: "a",
        type: "position",
        position: { x: 120, y: 100 },
        dragging: true,
      },
    ])
    store.getState().onNodesChange([
      {
        id: toGroupFrameId("g"),
        type: "position",
        position: { x: 20, y: 0 },
        dragging: false,
      },
      {
        id: "a",
        type: "position",
        position: { x: 120, y: 100 },
        dragging: false,
      },
    ])
    expect(store.getState().graph.nodes[0]?.position).toEqual({
      x: 120,
      y: 100,
    })
  })

  it("a free node dragged with a group joins the frame it lands in", () => {
    const store = createStore(
      [node("free", 900, 900)],
      [group("g"), group("h", { x: 2000, y: 0 })]
    )
    store.getState().onNodesChange([
      {
        id: toGroupFrameId("g"),
        type: "position",
        position: { x: 10, y: 0 },
        dragging: false,
      },
      {
        id: "free",
        type: "position",
        position: { x: 2100, y: 100 },
        dragging: false,
      },
    ])
    expect(groupOf(store, "free")).toBe("h")
  })
})

describe("mixed drags judge membership against the moved frame", () => {
  it("a free node dragged with a group does not join it through its old rectangle", () => {
    // g spans x 0..400; n's center starts at 550 and lands at 350 — inside the
    // old frame, but outside the moved one (-200..200).
    const store = createStore([node("n", 500, 100)], [group("g")])
    store.getState().onNodesChange([
      {
        id: toGroupFrameId("g"),
        type: "position",
        position: { x: -200, y: 0 },
        dragging: false,
      },
      {
        id: "n",
        type: "position",
        position: { x: 300, y: 100 },
        dragging: false,
      },
    ])

    expect(groupOf(store, "n")).toBeUndefined()
    expect(store.getState().graph.groups[0]).toMatchObject({
      x: -200,
      width: 400,
    })
  })

  it("a free node landing inside the moved frame joins it", () => {
    const store = createStore([node("n", 900, 100)], [group("g")])
    store.getState().onNodesChange([
      {
        id: toGroupFrameId("g"),
        type: "position",
        position: { x: 600, y: 0 },
        dragging: false,
      },
      {
        id: "n",
        type: "position",
        position: { x: 700, y: 100 },
        dragging: false,
      },
    ])

    expect(groupOf(store, "n")).toBe("g")
  })
})

describe("membership after node drag", () => {
  it("dropping a node into a frame joins it in the drag's single step", () => {
    const store = createStore([node("n", 900, 900)], [group("g")])
    const before = pasts(store)
    drag(store, "n", [
      { x: 500, y: 500 },
      { x: 100, y: 100 },
    ])
    expect(groupOf(store, "n")).toBe("g")
    expect(pasts(store)).toBe(before + 1)

    store.getState().undo()
    expect(groupOf(store, "n")).toBeUndefined()
  })

  it("dragging a member out leaves the group and keeps it", () => {
    const store = createStore([node("n", 100, 100, "g")], [group("g")])
    drag(store, "n", [{ x: 900, y: 100 }])
    expect(groupOf(store, "n")).toBeUndefined()
    expect(store.getState().graph.groups).toHaveLength(1)
  })

  it("the frame grows to follow a member while it is dragged, and commits once", () => {
    const store = createStore([node("n", 100, 100, "g")], [group("g")])
    const before = pasts(store)
    store.getState().onNodesChange([
      {
        id: "n",
        type: "position",
        position: { x: 340, y: 100 },
        dragging: true,
      },
    ])
    expect(store.getState().graph.groups[0]?.width).toBe(
      340 + 100 + GROUP_FRAME_PADDING
    )
    expect(pasts(store)).toBe(before)

    store.getState().onNodesChange([
      {
        id: "n",
        type: "position",
        position: { x: 340, y: 100 },
        dragging: false,
      },
    ])
    expect(pasts(store)).toBe(before + 1)

    store.getState().undo()
    expect(store.getState().graph.groups[0]?.width).toBe(400)
  })

  it("a member dragged toward the center leaves the frame unchanged", () => {
    const store = createStore([node("n", 300, 100, "g")], [group("g")])
    drag(store, "n", [{ x: 150, y: 150 }])
    expect(store.getState().graph.groups[0]).toMatchObject({
      x: 0,
      y: 0,
      width: 400,
      height: 400,
    })
  })

  it("a node added from the palette inside a frame joins it", () => {
    const store = createStore([], [group("g")])
    store.getState().addNode("result", { x: 100, y: 100 })
    const added = store.getState().graph.nodes[0]
    expect(added?.data.groupId).toBe("g")
  })
})

describe("copying groups", () => {
  const clipboard = { text: "" }

  beforeEach(() => {
    clipboard.text = ""
    Object.defineProperty(window.navigator, "clipboard", {
      value: {
        writeText: vi.fn(async (text: string) => {
          clipboard.text = text
        }),
        readText: vi.fn(async () => clipboard.text),
      },
      configurable: true,
    })
  })

  it("duplicating a selected group copies it with its members and a new id", () => {
    const store = createStore(
      [node("a", 100, 100, "g"), node("b", 200, 100, "g")],
      [group("g", { label: "Parse", color: "green", collapsed: true })],
      [edge("a", "b")]
    )
    store.getState().setSelectedGroups(["g"])

    expect(store.getState().duplicateNodes()).toBe(true)

    const { groups, nodes, edges } = store.getState().graph
    expect(groups).toHaveLength(2)
    const copy = groups[1]!
    expect(copy).toMatchObject({
      label: "Parse",
      color: "green",
      collapsed: true,
      width: 400,
      height: 400,
      x: 40,
      y: 40,
    })
    expect(copy.id).not.toBe("g")
    expect(nodes.filter((n) => n.data.groupId === copy.id)).toHaveLength(2)
    expect(edges).toHaveLength(2)
    expect(store.getState().selectedGroupIds).toEqual([copy.id])
  })

  it("duplicating part of a group leaves the copies ungrouped", () => {
    const store = createStore(
      [
        node("a", 100, 100, "g"),
        node("b", 200, 100, "g"),
        node("c", 300, 100, "g"),
      ],
      [group("g")]
    )
    store.getState().setSelectedNodes(["a", "b"])
    store.getState().duplicateNodes()

    const copies = store.getState().graph.nodes.slice(3)
    expect(copies).toHaveLength(2)
    expect(copies.every((n) => n.data.groupId === undefined)).toBe(true)
    expect(store.getState().graph.groups).toHaveLength(1)
  })

  it("copy and paste of a whole group pastes a new group", async () => {
    const store = createStore(
      [node("a", 100, 100, "g"), node("b", 200, 100, "g")],
      [group("g", { label: "Parse", color: "red" })]
    )
    store.getState().setSelectedGroups(["g"])
    expect(await store.getState().copySelectionToClipboard()).toBe(true)

    expect(
      await store.getState().pasteFromClipboard({ x: 1000, y: 1000 })
    ).toBe(true)

    const pasted = store.getState().graph.groups[1]!
    expect(pasted).toMatchObject({
      label: "Parse",
      color: "red",
      width: 400,
      height: 400,
      x: 1000,
      y: 1000,
    })
    const members = store
      .getState()
      .graph.nodes.filter((n) => n.data.groupId === pasted.id)
    expect(members.map((n) => n.position)).toEqual([
      { x: 1100, y: 1100 },
      { x: 1200, y: 1100 },
    ])
  })

  it("paste of part of a group pastes ungrouped nodes", async () => {
    const store = createStore(
      [
        node("a", 100, 100, "g"),
        node("b", 200, 100, "g"),
        node("c", 300, 100, "g"),
      ],
      [group("g")]
    )
    store.getState().setSelectedNodes(["a", "b"])
    await store.getState().copySelectionToClipboard()
    await store.getState().pasteFromClipboard({ x: 0, y: 900 })

    expect(store.getState().graph.groups).toHaveLength(1)
    expect(
      store
        .getState()
        .graph.nodes.slice(3)
        .every((n) => !n.data.groupId)
    ).toBe(true)
  })

  it("copy and paste of an empty group pastes a new empty group", async () => {
    const store = createStore([], [group("g", { label: "Empty" })])
    store.getState().setSelectedGroups(["g"])
    expect(await store.getState().copySelectionToClipboard()).toBe(true)
    await store.getState().pasteFromClipboard({ x: 500, y: 500 })

    expect(store.getState().graph.groups).toHaveLength(2)
    expect(store.getState().graph.groups[1]).toMatchObject({
      label: "Empty",
      x: 500,
      y: 500,
    })
    expect(store.getState().graph.nodes).toEqual([])
  })
})

describe("review follow-ups", () => {
  it("a drop that only changes membership is still an undo step", () => {
    // A node already inside the frame but not a member, dropped in place.
    const store = createStore([node("n", 100, 100)], [group("g")])
    const before = pasts(store)
    store.getState().onNodesChange([
      {
        id: "n",
        type: "position",
        position: { x: 100, y: 100 },
        dragging: false,
      },
    ])
    expect(groupOf(store, "n")).toBe("g")
    expect(pasts(store)).toBe(before + 1)

    store.getState().undo()
    expect(groupOf(store, "n")).toBeUndefined()
  })

  it("deleting a selected group also deletes selected edges in the same step", () => {
    const store = createStore(
      [node("a", 100, 100, "g"), node("x", 900, 0), node("y", 900, 300)],
      [group("g")],
      [{ ...edge("x", "y"), selected: true }]
    )
    store.getState().setSelectedGroups(["g"])
    const before = pasts(store)

    store.getState().deleteSelection()

    expect(store.getState().graph.edges).toEqual([])
    expect(pasts(store)).toBe(before + 1)
  })

  it("an import drops the group selection", () => {
    const store = createStore([], [group("g")])
    store.getState().setSelectedGroups(["g"])
    const json = JSON.stringify(store.getState().exportDomain())

    expect(store.getState().importFromJson(json)).toBe(true)
    expect(store.getState().selectedGroupIds).toEqual([])
  })
})

describe("selection of groups", () => {
  it("ignores unknown group ids", () => {
    const store = createStore([], [group("g")])
    store.getState().setSelectedGroups(["g", "nope"])
    expect(store.getState().selectedGroupIds).toEqual(["g"])
  })

  it("drops a group removed by undo from the selection", () => {
    const store = createStore([node("a", 0, 0)])
    const id = store.getState().groupNodes(["a"])
    expect(store.getState().selectedGroupIds).toEqual([id])
    store.getState().undo()
    expect(store.getState().selectedGroupIds).toEqual([])
  })
})
