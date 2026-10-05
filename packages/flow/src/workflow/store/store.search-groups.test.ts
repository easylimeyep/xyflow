import { describe, expect, it } from "vitest"

import { toGroupFrameId } from "../groups/group-canvas-ids"
import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import type { WorkflowGraphState } from "../types/types"
import {
  selectCurrentSearchRevealId,
  selectGroupSearchStatus,
  selectNodeSearchStatus,
  selectSearchMatches,
  selectSearchSourceCounts,
  selectSearchTotal,
} from "./search-selectors"
import { createWorkflowStore } from "./store"

function graph(): WorkflowGraphState {
  return {
    nodes: [
      {
        id: "n",
        type: "result",
        position: { x: 0, y: 100 },
        data: {
          kind: "result",
          label: "Parse step",
          config: { category: "true" },
          groupId: "g",
        },
      },
    ],
    edges: [],
    groups: [
      {
        id: "g",
        label: "Parse response",
        color: "blue",
        x: -20,
        y: 0,
        width: 400,
        height: 300,
        collapsed: true,
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    document: { id: "d", name: "d", version: 1, metadata: {} },
  }
}

function searchStore(query = "parse") {
  const store = createWorkflowStore({
    definitions: builtinBaseDefinitions,
    initialGraph: graph(),
  })
  store.getState().openSearch()
  store.getState().setSearchQuery(query)
  return store
}

describe("canvas search over groups", () => {
  it("lists and counts a group label match ahead of its member", () => {
    const store = searchStore()
    const state = store.getState()

    expect(selectSearchMatches(state).map((match) => match.target)).toEqual([
      "group",
      "node",
    ])
    expect(selectSearchTotal(state)).toBe(2)
    expect(selectSearchSourceCounts(state).label).toBe(2)
    expect(selectGroupSearchStatus(state, "g")).toBe("current")
    expect(selectNodeSearchStatus(state, "n")).toBe("match")
  })

  it("leaves group matches out when the labels filter is off", () => {
    const store = searchStore()
    store.getState().setSearchSources({
      label: false,
      "variable-definition": true,
      "variable-reference": true,
    })

    expect(selectSearchTotal(store.getState())).toBe(0)
    expect(selectGroupSearchStatus(store.getState(), "g")).toBe("none")
  })

  it("reveals the group's frame, not a member, for a group match", () => {
    const store = searchStore()
    expect(selectCurrentSearchRevealId(store.getState())).toBe(
      toGroupFrameId("g")
    )

    store.getState().searchNext()
    expect(selectCurrentSearchRevealId(store.getState())).toBe("n")
  })

  it("drops a group whose new label no longer matches", () => {
    const store = searchStore()
    store.getState().renameGroup("g", "Totals")

    expect(
      selectSearchMatches(store.getState()).map((match) => match.target)
    ).toEqual(["node"])
  })

  it("selects the group for a group match, without selecting nodes", () => {
    const store = searchStore()
    store.getState().setSelectedNodes(["n"])

    store.getState().selectCurrentSearchNode()

    expect(store.getState().selectedGroupIds).toEqual(["g"])
    expect(store.getState().selectedNodeIds).toEqual([])
  })

  it("keeps the collapsed group collapsed while its label is current", () => {
    const store = searchStore()
    expect(store.getState().graph.groups[0]?.collapsed).toBe(true)
  })
})
