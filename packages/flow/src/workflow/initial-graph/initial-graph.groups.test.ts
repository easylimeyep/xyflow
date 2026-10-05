import { describe, expect, it } from "vitest"

import { getMemberBounds } from "../groups/group-geometry"
import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import type { InitialGraphInput } from "./initial-graph"
import { createInitialGraph, createInitialGraphElk } from "./initial-graph"

const setter = (id: string) => ({
  id,
  kind: "setVariable" as const,
  config: { variableName: id, valueExpression: "1" },
})

const input: InitialGraphInput = {
  nodes: [setter("a"), setter("b"), setter("c"), setter("d")],
  edges: [
    { source: "a", target: "b" },
    { source: "b", target: "c" },
    { source: "c", target: "d" },
  ],
  groups: [
    { id: "parse", label: "Parse", color: "green", nodeIds: ["b", "c"] },
    { id: "done", nodeIds: ["d"], collapsed: true },
    { id: "notes", nodeIds: [] },
  ],
}

describe("initial graph groups", () => {
  it("assigns members and defaults", () => {
    const graph = createInitialGraph(builtinBaseDefinitions, input)

    expect(graph.nodes.map((node) => [node.id, node.data.groupId])).toEqual([
      ["a", undefined],
      ["b", "parse"],
      ["c", "parse"],
      ["d", "done"],
    ])
    expect(
      graph.groups.map(({ id, label, color, collapsed }) => ({
        id,
        label,
        color,
        collapsed,
      }))
    ).toEqual([
      { id: "parse", label: "Parse", color: "green", collapsed: false },
      { id: "done", label: "Group 2", color: "blue", collapsed: true },
      { id: "notes", label: "Group 3", color: "blue", collapsed: false },
    ])
  })

  it.each([
    [
      "an unknown node",
      [{ id: "g", nodeIds: ["missing"] }],
      /unknown node: missing/,
    ],
    [
      "a node in two groups",
      [
        { id: "g", nodeIds: ["a"] },
        { id: "h", nodeIds: ["a"] },
      ],
      /more than one group/,
    ],
    [
      "a duplicate group id",
      [
        { id: "g", nodeIds: [] },
        { id: "g", nodeIds: [] },
      ],
      /Duplicate initial graph group id/,
    ],
  ])("fails clearly for %s", (_name, groups, message) => {
    expect(() =>
      createInitialGraph(builtinBaseDefinitions, { ...input, groups })
    ).toThrow(message)
  })

  it("lays members out first and fits frames around them, collapsed ones too", async () => {
    const graph = await createInitialGraphElk(builtinBaseDefinitions, input)

    for (const groupId of ["parse", "done"]) {
      const group = graph.groups.find((g) => g.id === groupId)!
      const bounds = getMemberBounds(
        graph.nodes.filter((node) => node.data.groupId === groupId)
      )!
      expect(group.x).toBeLessThan(bounds.x)
      expect(group.x + group.width).toBeGreaterThan(bounds.x + bounds.width)
    }
    // Members were laid out, not left stacked at the origin.
    const [b, c] = ["b", "c"].map(
      (id) => graph.nodes.find((node) => node.id === id)!.position
    )
    expect(b).not.toEqual(c)
    expect(graph.groups.find((g) => g.id === "done")?.collapsed).toBe(true)
  })
})
