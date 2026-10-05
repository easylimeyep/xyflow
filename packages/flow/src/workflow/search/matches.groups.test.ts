import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../node-registry/node-factory"
import { createNodeRegistry } from "../node-registry/registry"
import type { WorkflowGroup } from "../types/types"
import { buildSearchMatches, reconcileCurrentMatch } from "./matches"

const registry = createNodeRegistry(builtinBaseDefinitions)

function group(label: string, x = 0, y = 0, id = "g"): WorkflowGroup {
  return {
    id,
    label,
    color: "blue",
    x,
    y,
    width: 400,
    height: 300,
    collapsed: false,
  }
}

describe("buildSearchMatches with groups", () => {
  it("finds a group by its label", () => {
    const [match] = buildSearchMatches([], registry, "parse", undefined, [
      group("Parse response"),
    ])

    expect(match).toMatchObject({
      target: "group",
      groupId: "g",
      source: "label",
      start: 0,
      end: 5,
    })
  })

  it("follows the matching options", () => {
    const groups = [group("Parse response")]
    expect(
      buildSearchMatches(
        [],
        registry,
        "parse",
        { matchCase: true, wholeWord: false },
        groups
      )
    ).toEqual([])
    expect(
      buildSearchMatches(
        [],
        registry,
        "pars",
        { matchCase: false, wholeWord: true },
        groups
      )
    ).toEqual([])
  })

  it("puts a group ahead of a member at the same position", () => {
    const member = createWorkflowNode(
      registry,
      "result",
      { x: 0, y: 0 },
      "Parse step"
    )
    const matches = buildSearchMatches([member], registry, "parse", undefined, [
      group("Parse response", 0, 0),
    ])

    expect(matches.map((match) => match.target)).toEqual(["group", "node"])
  })

  it("orders groups by their frame position among nodes", () => {
    const above = createWorkflowNode(
      registry,
      "result",
      { x: 0, y: -100 },
      "Parse a"
    )
    const below = createWorkflowNode(
      registry,
      "result",
      { x: 0, y: 500 },
      "Parse b"
    )
    const matches = buildSearchMatches(
      [below, above],
      registry,
      "parse",
      undefined,
      [group("Parse group", 0, 100)]
    )

    expect(
      matches.map((match) =>
        match.target === "group" ? match.groupId : match.nodeId
      )
    ).toEqual([above.id, "g", below.id])
  })

  it("keeps a group match by identity across recomputes", () => {
    const before = buildSearchMatches([], registry, "parse", undefined, [
      group("Parse response", 0, 0),
    ])
    const after = buildSearchMatches([], registry, "parse", undefined, [
      group("Parse response", 300, 300),
    ])
    const current = reconcileCurrentMatch(
      before[0]!.key,
      before[0]!.sortTuple,
      after
    )

    expect(current?.key).toBe(before[0]!.key)
  })
})
