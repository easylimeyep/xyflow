import { describe, expect, it } from "vitest"

import { toGroupFrameId } from "../groups/group-canvas-ids"
import {
  GROUP_CARD_HEIGHT,
  GROUP_CARD_WIDTH,
  getMemberBounds,
} from "../groups/group-geometry"
import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../node-registry/registry"
import type {
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../types/types"
import { collectCollapsedBlocks, remapEdgesToBlocks } from "./elk-groups"
import { buildElkGraph, computeWorkflowAutoLayout } from "./elk-layout"

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

function group(id: string, collapsed: boolean, rect = {}): WorkflowGroup {
  return {
    id,
    label: id,
    color: "blue",
    x: 0,
    y: 0,
    width: 3000,
    height: 3000,
    collapsed,
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

describe("auto-layout with groups", () => {
  it("lays a collapsed group out as one block wired to its card ports", () => {
    const source = graph(
      [
        node("a", 0, 0),
        node("m1", 0, 0, "c"),
        node("m2", 0, 0, "c"),
        node("z", 0, 0),
      ],
      [edge("a", "m1"), edge("m1", "m2"), edge("m2", "z"), edge("a", "m2")],
      [group("c", true, { x: 100, y: 100 })]
    )
    const blocks = collectCollapsedBlocks(source)
    const elk = buildElkGraph(
      registry,
      source.nodes.filter((n) => !n.data.groupId),
      remapEdgesToBlocks(source.edges, blocks),
      blocks
    )

    const block = elk.children.find((c) => c.id === toGroupFrameId("c"))
    expect(block).toMatchObject({
      width: GROUP_CARD_WIDTH,
      height: GROUP_CARD_HEIGHT,
    })
    expect(elk.children.map((c) => c.id)).toEqual([
      "a",
      "z",
      toGroupFrameId("c"),
    ])
    // a→m1 and a→m2 merge into one edge to the block; m1→m2 disappears.
    expect(elk.edges.map((e) => [e.sources[0], e.targets[0]])).toEqual([
      ["a::source", `${toGroupFrameId("c")}::target`],
      [`${toGroupFrameId("c")}::source`, "z::target"],
    ])
  })

  it("keeps the relative positions of a collapsed group's members", async () => {
    const before = graph(
      [
        node("a", 0, 0),
        node("m1", 1000, 1000, "c"),
        node("m2", 1300, 1200, "c"),
        node("z", 0, 500),
      ],
      [edge("a", "m1"), edge("m1", "m2"), edge("m2", "z")],
      [group("c", true, { x: 980, y: 940 })]
    )

    const after = await computeWorkflowAutoLayout(registry, before)
    const position = (g: WorkflowGraphState, id: string) =>
      g.nodes.find((n) => n.id === id)!.position
    const groupAfter = after.groups[0]!

    expect(position(after, "m2").x - position(after, "m1").x).toBe(300)
    expect(position(after, "m2").y - position(after, "m1").y).toBe(200)
    // The members kept their offset from the group corner, which moved.
    expect(position(after, "m1").x - groupAfter.x).toBe(20)
    expect(position(after, "m1").y - groupAfter.y).toBe(60)
  })

  it("fits every non-empty expanded frame around its members", async () => {
    const before = graph(
      [node("a", 0, 0), node("m1", 0, 0, "e"), node("m2", 0, 0, "e")],
      [edge("a", "m1"), edge("m1", "m2")],
      [
        group("e", false),
        group("empty", false, { x: 5, y: 6, width: 300, height: 200 }),
      ]
    )

    const after = await computeWorkflowAutoLayout(registry, before)
    const frame = after.groups.find((g) => g.id === "e")!
    const bounds = getMemberBounds(
      after.nodes.filter((n) => n.data.groupId === "e")
    )!

    expect(frame.width).toBeLessThan(3000)
    expect(frame.x).toBeLessThan(bounds.x)
    expect(frame.y).toBeLessThan(bounds.y)
    expect(frame.x + frame.width).toBeGreaterThan(bounds.x + bounds.width)
    expect(frame.y + frame.height).toBeGreaterThan(bounds.y + bounds.height)
    expect(after.groups.find((g) => g.id === "empty")).toEqual(before.groups[1])
  })
})
