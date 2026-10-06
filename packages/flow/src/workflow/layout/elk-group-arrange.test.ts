import { describe, expect, it } from "vitest"

import { fitToContents, getMemberBounds } from "../groups/group-geometry"
import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../node-registry/registry"
import type {
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../types/types"
import {
  computeGroupArrangeLayout,
  rebaseGroupArrange,
} from "./elk-group-arrange"
import type { ElkGraph, ElkLayoutEngine } from "./elk-layout"

const registry = createNodeRegistry(builtinBaseDefinitions)

function node(
  id: string,
  x: number,
  y: number,
  groupId?: string
): WorkflowNode {
  return {
    id,
    type: "setVariable",
    position: { x, y },
    measured: { width: 200, height: 120 },
    data: {
      kind: "setVariable",
      label: id,
      config: {
        variableName: id,
        variableType: "value",
        valueExpression: "",
        clear: false,
      },
      ...(groupId ? { groupId } : {}),
    },
  }
}

function edge(source: string, target: string): WorkflowEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    sourceHandle: null,
    targetHandle: null,
    data: { sourceKind: "setVariable", targetKind: "setVariable" },
  }
}

function group(id: string, rect: Partial<WorkflowGroup> = {}): WorkflowGroup {
  return {
    id,
    label: id,
    color: "blue",
    x: 0,
    y: 0,
    width: 3000,
    height: 3000,
    collapsed: false,
    ...rect,
  }
}

function graph(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  groups: WorkflowGroup[]
): WorkflowGraphState {
  return {
    nodes,
    edges,
    groups,
    viewport: { x: 0, y: 0, zoom: 1 },
    document: { id: "d", name: "d", version: 1, metadata: {} },
  }
}

/** An engine that places nodes at fixed positions and records what it saw. */
function stubEngine(positions: Record<string, { x: number; y: number }>) {
  const seen: ElkGraph[] = []
  const engine: ElkLayoutEngine = {
    layout: async (elkGraph) => {
      seen.push(elkGraph)
      return {
        children: elkGraph.children.map((child) => ({
          ...child,
          ...(positions[child.id] ?? { x: 0, y: 0 }),
        })),
      }
    },
  }
  return { engine, seen }
}

const failingEngine: ElkLayoutEngine = {
  layout: async () => {
    throw new Error("must not be called")
  },
}

function positionOf(state: WorkflowGraphState, id: string) {
  return state.nodes.find((n) => n.id === id)?.position
}

describe("computeGroupArrangeLayout", () => {
  // A → B → C, stored out of order (C left of A).
  const chain = graph(
    [
      node("a", 700, 400, "g"),
      node("b", 300, 900, "g"),
      node("c", 100, 500, "g"),
      node("out", 5000, 5000),
    ],
    [edge("a", "b"), edge("b", "c"), edge("c", "out")],
    [group("g", { x: 0, y: 0, width: 2000, height: 2000 }), group("other")]
  )
  const elkPositions = {
    a: { x: 0, y: 0 },
    b: { x: 360, y: 0 },
    c: { x: 720, y: 0 },
  }

  it("lays the members out along their internal edges", async () => {
    const { engine } = stubEngine(elkPositions)
    const next = await computeGroupArrangeLayout(registry, chain, "g", engine)

    const a = positionOf(next, "a")!
    const b = positionOf(next, "b")!
    const c = positionOf(next, "c")!
    expect(a.x).toBeLessThan(b.x)
    expect(b.x).toBeLessThan(c.x)
    expect(a.y).toBe(b.y)
  })

  it("keeps the top-left corner of the members' bounds", async () => {
    const before = getMemberBounds(chain.nodes.slice(0, 3))!
    const { engine } = stubEngine(elkPositions)
    const next = await computeGroupArrangeLayout(registry, chain, "g", engine)

    const after = getMemberBounds(
      next.nodes.filter((n) => n.data.groupId === "g")
    )!
    expect({ x: after.x, y: after.y }).toEqual({ x: before.x, y: before.y })
  })

  it("fits the frame to the moved members", async () => {
    const { engine } = stubEngine(elkPositions)
    const next = await computeGroupArrangeLayout(registry, chain, "g", engine)

    const members = next.nodes.filter((n) => n.data.groupId === "g")
    const frame = next.groups.find((g) => g.id === "g")!
    expect(frame).toEqual(fitToContents(chain.groups[0]!, members))
  })

  it("leaves non-members and other groups untouched", async () => {
    const { engine } = stubEngine(elkPositions)
    const next = await computeGroupArrangeLayout(registry, chain, "g", engine)

    expect(next.nodes.find((n) => n.id === "out")).toBe(chain.nodes[3])
    expect(next.groups.find((g) => g.id === "other")).toBe(chain.groups[1])
    expect(next.edges).toBe(chain.edges)
  })

  it("lays out only the members and the edges between them", async () => {
    const { engine, seen } = stubEngine(elkPositions)
    await computeGroupArrangeLayout(registry, chain, "g", engine)

    expect(seen[0]!.children.map((child) => child.id).sort()).toEqual([
      "a",
      "b",
      "c",
    ])
    expect(seen[0]!.edges.map((e) => e.id).sort()).toEqual(["a-b", "b-c"])
  })

  it.each([
    ["a missing group", "nope", chain],
    [
      "a collapsed group",
      "g",
      { ...chain, groups: [group("g", { collapsed: true })] },
    ],
    ["an empty group", "other", chain],
  ])("returns the same graph for %s", async (_, groupId, source) => {
    const next = await computeGroupArrangeLayout(
      registry,
      source,
      groupId,
      failingEngine
    )
    expect(next).toBe(source)
  })

  it("returns the same graph when nothing moves", async () => {
    const fitted = graph(
      [node("a", 100, 100, "g"), node("b", 460, 100, "g")],
      [edge("a", "b")],
      [group("g")]
    )
    const settled = {
      ...fitted,
      groups: [fitToContents(fitted.groups[0]!, fitted.nodes)],
    }
    const { engine } = stubEngine({ a: { x: 0, y: 0 }, b: { x: 360, y: 0 } })

    const next = await computeGroupArrangeLayout(registry, settled, "g", engine)
    expect(next).toBe(settled)
  })

  it("arranges a group without overlaps using the real ELK engine", async () => {
    const source = graph(
      [
        node("a", 400, 400, "g"),
        node("b", 420, 410, "g"),
        node("c", 410, 430, "g"),
        node("d", 430, 420, "g"),
      ],
      [edge("a", "b"), edge("a", "c"), edge("b", "d")],
      [group("g")]
    )

    const next = await computeGroupArrangeLayout(registry, source, "g")

    const rects = next.nodes.map((n) => ({
      ...n.position,
      right: n.position.x + 200,
      bottom: n.position.y + 120,
    }))
    rects.forEach((first, i) =>
      rects.slice(i + 1).forEach((second) => {
        const overlaps =
          first.x < second.right &&
          second.x < first.right &&
          first.y < second.bottom &&
          second.y < first.bottom
        expect(overlaps).toBe(false)
      })
    )
    expect(positionOf(next, "a")!.x).toBeLessThan(positionOf(next, "b")!.x)
    expect(positionOf(next, "b")!.x).toBeLessThan(positionOf(next, "d")!.x)
  })
})

describe("rebaseGroupArrange", () => {
  const start = graph(
    [node("a", 700, 400, "g"), node("b", 100, 500, "g"), node("out", 0, 0)],
    [edge("a", "b")],
    [group("g", { width: 2000 }), group("h")]
  )
  const arranged: WorkflowGraphState = {
    ...start,
    nodes: [
      { ...start.nodes[0]!, position: { x: 100, y: 400 } },
      { ...start.nodes[1]!, position: { x: 460, y: 400 } },
      start.nodes[2]!,
    ],
    groups: [
      group("g", { x: 76, y: 336, width: 608, height: 208 }),
      group("h"),
    ],
  }
  const withNodes = (
    source: WorkflowGraphState,
    update: (node: WorkflowNode) => WorkflowNode
  ): WorkflowGraphState => ({ ...source, nodes: source.nodes.map(update) })

  it("returns the arranged graph when nothing changed", () => {
    expect(rebaseGroupArrange(start, arranged, start, "g")).toBe(arranged)
  })

  it("applies the arrangement over a selection change", () => {
    const current = withNodes(start, (n) =>
      n.id === "a" || n.id === "out" ? { ...n, selected: true } : n
    )

    const rebased = rebaseGroupArrange(start, arranged, current, "g")!

    expect(rebased.nodes.map((n) => [n.id, n.position, n.selected])).toEqual([
      ["a", { x: 100, y: 400 }, true],
      ["b", { x: 460, y: 400 }, undefined],
      ["out", { x: 0, y: 0 }, true],
    ])
    expect(rebased.groups[0]).toEqual(arranged.groups[0])
  })

  it("keeps edits that do not affect the layout", () => {
    const current: WorkflowGraphState = {
      ...start,
      groups: [{ ...start.groups[0]!, label: "Renamed" }, group("h", { x: 9 })],
      nodes: start.nodes.map((n) =>
        n.id === "out" ? { ...n, position: { x: 50, y: 50 } } : n
      ),
    }

    const rebased = rebaseGroupArrange(start, arranged, current, "g")!

    expect(rebased.groups[0]).toMatchObject({ label: "Renamed", x: 76 })
    expect(rebased.groups[1]).toBe(current.groups[1])
    expect(rebased.nodes[2]).toBe(current.nodes[2])
  })

  it.each([
    [
      "a member moved",
      withNodes(start, (n) =>
        n.id === "a" ? { ...n, position: { x: 1, y: 1 } } : n
      ),
    ],
    [
      "a member was resized",
      withNodes(start, (n) =>
        n.id === "b" ? { ...n, measured: { width: 300, height: 120 } } : n
      ),
    ],
    [
      "a member left",
      withNodes(start, (n) =>
        n.id === "b" ? { ...n, data: { ...n.data, groupId: undefined } } : n
      ),
    ],
    [
      "a node joined",
      withNodes(start, (n) =>
        n.id === "out" ? { ...n, data: { ...n.data, groupId: "g" } } : n
      ),
    ],
    ["an internal edge was removed", { ...start, edges: [] }],
    [
      "the group was collapsed",
      { ...start, groups: [{ ...start.groups[0]!, collapsed: true }] },
    ],
    ["the group was deleted", { ...start, groups: [group("h")] }],
  ])("returns null when %s", (_name, current) => {
    expect(rebaseGroupArrange(start, arranged, current, "g")).toBeNull()
  })
})
