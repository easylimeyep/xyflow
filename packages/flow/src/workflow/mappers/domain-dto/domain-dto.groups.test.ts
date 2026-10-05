import { omit } from "es-toolkit/object"
import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { createNodeRegistry } from "../../node-registry/registry"
import { DEFAULT_WORKFLOW_GROUP_COLOR } from "../../types/types"
import { internalToDomain } from "../converters/converters"

import { toDomainDTO } from "./domain-dto"

const registry = createNodeRegistry(builtinBaseDefinitions)
const base = internalToDomain(registry, {
  nodes: [
    createWorkflowNode(registry, "result", { x: 0, y: 0 }),
    createWorkflowNode(registry, "result", { x: 300, y: 0 }, "Result 2"),
  ],
  edges: [],
  groups: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  document: { id: "doc", name: "Doc", version: 1, metadata: {} },
})
const [firstNodeId = "", secondNodeId = ""] = base.nodes.map((node) => node.id)

function validGroup(overrides: Record<string, unknown> = {}) {
  return {
    id: "g1",
    label: "Group 1",
    color: "green",
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    collapsed: false,
    nodeIds: [firstNodeId],
    ...overrides,
  }
}

function decode(groups: unknown) {
  return toDomainDTO(registry, { ...base, groups })
}

function expectRejected(groups: unknown) {
  const result = decode(groups)
  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error).toMatch(/group/i)
  }
}

describe("toDomainDTO groups", () => {
  it("reads a missing groups field as an empty list", () => {
    const result = toDomainDTO(registry, omit(base, ["groups"]))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.groups).toEqual([])
    }
  })

  it("decodes a valid group", () => {
    const result = decode([validGroup()])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.groups).toEqual([validGroup()])
    }
  })

  it("accepts an empty group", () => {
    const result = decode([validGroup({ nodeIds: [] })])
    expect(result.success).toBe(true)
  })

  it("rejects groups that is not an array", () => {
    expectRejected({})
  })

  it.each([
    ["id", { id: 1 }],
    ["label", { label: 5 }],
    ["empty label", { label: "   " }],
    ["color", { color: null }],
    ["x", { x: "0" }],
    ["y", { y: Number.NaN }],
    ["collapsed", { collapsed: "no" }],
    ["nodeIds", { nodeIds: "a" }],
    ["nodeIds entry", { nodeIds: [1] }],
  ])("rejects a group with an invalid %s", (_name, overrides) => {
    expectRejected([validGroup(overrides)])
  })

  it.each([
    ["missing id", "id"],
    ["missing width", "width"],
    ["missing collapsed", "collapsed"],
    ["missing nodeIds", "nodeIds"],
  ])("rejects a group with %s", (_name, key) => {
    const group: Record<string, unknown> = validGroup()
    delete group[key]
    expectRejected([group])
  })

  it.each([
    ["zero width", { width: 0 }],
    ["negative height", { height: -10 }],
    ["infinite width", { width: Number.POSITIVE_INFINITY }],
  ])("rejects a group with %s", (_name, overrides) => {
    expectRejected([validGroup(overrides)])
  })

  it("rejects a node id that is not in nodes", () => {
    expectRejected([validGroup({ nodeIds: ["missing-node"] })])
  })

  it("rejects a node listed in two groups", () => {
    expectRejected([
      validGroup({ id: "g1", nodeIds: [firstNodeId] }),
      validGroup({ id: "g2", nodeIds: [firstNodeId, secondNodeId] }),
    ])
  })

  it("rejects a node listed twice in one group", () => {
    expectRejected([validGroup({ nodeIds: [firstNodeId, firstNodeId] })])
  })

  it("rejects duplicate group ids", () => {
    expectRejected([
      validGroup({ id: "g1", nodeIds: [] }),
      validGroup({ id: "g1", nodeIds: [] }),
    ])
  })

  it("normalizes an unknown color token to the default", () => {
    const result = decode([validGroup({ color: "teal-900" })])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.groups?.[0]?.color).toBe(DEFAULT_WORKFLOW_GROUP_COLOR)
    }
  })
})
