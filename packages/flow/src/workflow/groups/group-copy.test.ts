import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../node-registry/node-factory"
import { createNodeRegistry } from "../node-registry/registry"
import type { WorkflowGroup, WorkflowNode } from "../types/types"

import { collectCopiedSelection } from "./group-copy"

const registry = createNodeRegistry(builtinBaseDefinitions)

function member(id: string, groupId?: string): WorkflowNode {
  const node = createWorkflowNode(registry, "result", { x: 0, y: 0 }, id)
  return {
    ...node,
    id,
    data: { ...node.data, ...(groupId ? { groupId } : {}) },
  }
}

function group(id: string): WorkflowGroup {
  return {
    id,
    label: id,
    color: "blue",
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    collapsed: false,
  }
}

const graph = {
  nodes: [
    member("a", "g1"),
    member("b", "g1"),
    member("c", "g2"),
    member("d", "g2"),
    member("e"),
  ],
  groups: [group("g1"), group("g2"), group("empty")],
}

describe("collectCopiedSelection", () => {
  it("copies a selected group with all of its members", () => {
    const copied = collectCopiedSelection(graph, [], ["g1"])
    expect([...copied.nodeIds].sort()).toEqual(["a", "b"])
    expect(copied.groups.map((g) => [g.id, g.nodeIds])).toEqual([
      ["g1", ["a", "b"]],
    ])
  })

  it("copies a group whose members were all copied", () => {
    const copied = collectCopiedSelection(graph, ["c", "d", "e"])
    expect(copied.groups.map((g) => g.id)).toEqual(["g2"])
  })

  it("leaves out a group that was only partly copied", () => {
    const copied = collectCopiedSelection(graph, ["a", "c", "d"])
    expect(copied.groups.map((g) => g.id)).toEqual(["g2"])
    expect(copied.nodeIds.has("a")).toBe(true)
  })

  it("copies a selected empty group", () => {
    const copied = collectCopiedSelection(graph, [], ["empty"])
    expect(copied.nodeIds.size).toBe(0)
    expect(copied.groups.map((g) => [g.id, g.nodeIds])).toEqual([["empty", []]])
  })

  it("does not copy an unselected empty group", () => {
    expect(collectCopiedSelection(graph, ["e"]).groups).toEqual([])
  })
})
