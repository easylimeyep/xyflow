import { omit } from "es-toolkit/object"
import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { createNodeRegistry } from "../../node-registry/registry"
import type {
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../../types/types"

import { domainToInternal, internalToDomain } from "./converters"

const registry = createNodeRegistry(builtinBaseDefinitions)

function member(id: string, groupId?: string): WorkflowNode {
  const node = createWorkflowNode(registry, "result", { x: 0, y: 0 }, id)
  return {
    ...node,
    id,
    data: { ...node.data, ...(groupId ? { groupId } : {}) },
  }
}

function group(overrides: Partial<WorkflowGroup> = {}): WorkflowGroup {
  return {
    id: "g1",
    label: "Group 1",
    color: "green",
    x: 10,
    y: 20,
    width: 400,
    height: 300,
    collapsed: false,
    ...overrides,
  }
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
    document: { id: "doc", name: "Doc", version: 1, metadata: {} },
  }
}

describe("group conversion", () => {
  it("exports groups with sorted member ids", () => {
    const dto = internalToDomain(
      registry,
      graph([member("c", "g1"), member("a", "g1"), member("b")], [group()])
    )
    expect(dto.groups).toEqual([{ ...group(), nodeIds: ["a", "c"] }])
  })

  it("always writes groups, even when there are none", () => {
    expect(internalToDomain(registry, graph([member("a")], [])).groups).toEqual(
      []
    )
  })

  it("roundtrips a regular, an empty, and a collapsed group", () => {
    const source = graph(
      [member("a", "g1"), member("b", "g1"), member("c", "g3"), member("d")],
      [
        group({ id: "g1" }),
        group({ id: "g2", label: "Empty" }),
        group({ id: "g3", label: "Folded", collapsed: true, color: "red" }),
      ]
    )
    const restored = domainToInternal(
      registry,
      internalToDomain(registry, source)
    )

    expect(restored.groups).toEqual(source.groups)
    expect(restored.nodes.map((node) => [node.id, node.data.groupId])).toEqual([
      ["a", "g1"],
      ["b", "g1"],
      ["c", "g3"],
      ["d", undefined],
    ])
    expect("groupId" in (restored.nodes[3]?.data ?? {})).toBe(false)
  })

  it("is deterministic regardless of the order members were added in", () => {
    const first = internalToDomain(
      registry,
      graph([member("a", "g1"), member("b", "g1")], [group()])
    )
    const second = internalToDomain(
      registry,
      graph([member("b", "g1"), member("a", "g1")], [group()])
    )
    expect(first.groups).toEqual(second.groups)
  })

  it("reads a dto without groups as no groups", () => {
    const dto = internalToDomain(registry, graph([member("a")], []))
    expect(domainToInternal(registry, omit(dto, ["groups"])).groups).toEqual([])
  })

  it("normalizes an unknown color coming from a host mapper", () => {
    const dto = internalToDomain(registry, graph([], [group()]))
    const restored = domainToInternal(registry, {
      ...dto,
      groups: [{ ...dto.groups![0]!, color: "teal-900" }],
    })
    expect(restored.groups[0]?.color).toBe("blue")
  })
})
