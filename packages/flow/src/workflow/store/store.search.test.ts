import { beforeEach, describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../node-registry/node-factory"
import { createNodeRegistry } from "../node-registry/registry"
import type { WorkflowGraphState, WorkflowNode } from "../types/types"
import {
  SEARCH_TITLE_FIELD,
  selectCurrentSearchMatch,
  selectFieldSearchStatus,
  selectNodeHasCurrentField,
  selectNodeSearchStatus,
  selectSearchCurrentIndex,
  selectSearchHiddenByFilters,
  selectSearchIsFiltered,
  selectSearchMatches,
  selectSearchSourceCounts,
  selectSearchTotal,
} from "./search-selectors"
import { createWorkflowStore } from "./store"

const registry = createNodeRegistry(builtinBaseDefinitions)

function inline(id: string, y: number, template: string[]): WorkflowNode {
  const node = createWorkflowNode(
    registry,
    "inlineExpression",
    { x: 0, y },
    "Inline"
  )
  node.data.config.template = template
  return { ...node, id }
}

function graph(nodes: WorkflowNode[]): WorkflowGraphState {
  return {
    nodes,
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    document: { id: "doc", name: "Doc", version: 1, metadata: {} },
  }
}

let store: ReturnType<typeof createWorkflowStore>

beforeEach(() => {
  store = createWorkflowStore({
    definitions: builtinBaseDefinitions,
    initialGraph: graph([
      inline("a", 0, ["{{ price }} {{ price }}"]),
      inline("b", 100, ["{{ price }}"]),
      inline("c", 200, ["{{ other }}"]),
    ]),
  })
})

function search(query: string) {
  store.getState().openSearch()
  store.getState().setSearchQuery(query)
}

describe("search slice", () => {
  it("never touches history or nodes", () => {
    const history = store.history.getState()
    search("price")
    store.getState().searchNext()
    store.getState().searchPrev()
    store.getState().closeSearch()

    expect(store.history.getState()).toBe(history)
  })

  it("keeps the undo stack as it was", () => {
    store.getState().updateNodeLabel("c", "Renamed")
    const past = store.history.getState().pasts

    search("price")
    store.getState().searchNext()

    expect(store.history.getState().pasts).toBe(past)
    store.getState().undo()
    expect(
      store.getState().graph.nodes.find((node) => node.id === "c")
        ?.data.label
    ).toBe("Inline")
  })

  it("starts at the first match and wraps both ways", () => {
    search("price")
    const state = () => store.getState()

    expect(selectSearchTotal(state())).toBe(3)
    expect(selectSearchCurrentIndex(state())).toBe(0)

    state().searchPrev()
    expect(selectSearchCurrentIndex(state())).toBe(2)

    state().searchNext()
    expect(selectSearchCurrentIndex(state())).toBe(0)
  })

  it("matches nothing while closed", () => {
    store.getState().setSearchQuery("price")

    expect(selectSearchMatches(store.getState())).toEqual([])
    expect(selectNodeSearchStatus(store.getState(), "a")).toBe("none")
  })

  it("clears the query and marks on close", () => {
    search("price")
    store.getState().closeSearch()
    store.getState().openSearch()

    expect(store.getState().search.query).toBe("")
    expect(selectNodeSearchStatus(store.getState(), "a")).toBe("none")
  })

  it("reports per-node status", () => {
    search("price")
    const state = store.getState()

    expect(selectNodeSearchStatus(state, "a")).toBe("current")
    expect(selectNodeSearchStatus(state, "b")).toBe("match")
    expect(selectNodeSearchStatus(state, "c")).toBe("none")
  })

  it("recomputes after a graph edit and keeps the current match", () => {
    search("price")
    store.getState().searchNext()
    const current = selectCurrentSearchMatch(store.getState())

    store.getState().updateNodeConfig("c", {
      kind: "inlineExpression",
      key: "template",
      value: ["{{ price }}"],
    })

    expect(selectSearchTotal(store.getState())).toBe(4)
    expect(selectCurrentSearchMatch(store.getState())?.key).toBe(current?.key)
    expect(selectSearchCurrentIndex(store.getState())).toBe(1)
  })

  it("moves to the following match when the current node is deleted", () => {
    search("price")
    store.getState().searchNext()
    store.getState().searchNext()
    expect(selectCurrentSearchMatch(store.getState())?.nodeId).toBe("b")

    store.getState().updateNodeConfig("c", {
      kind: "inlineExpression",
      key: "template",
      value: ["{{ price }}"],
    })
    store.getState().deleteNodes(["b"])

    expect(selectCurrentSearchMatch(store.getState())?.nodeId).toBe("c")
    expect(selectSearchTotal(store.getState())).toBe(3)
  })

  it("resets to the first match when the query changes", () => {
    search("price")
    store.getState().searchNext()
    store.getState().setSearchQuery("pric")

    expect(selectSearchCurrentIndex(store.getState())).toBe(0)
  })

  it("steps without changing the selection", () => {
    store.getState().setSelectedNode("c")
    search("price")
    store.getState().searchNext()
    store.getState().searchPrev()

    expect(store.getState().selectedNodeIds).toEqual(["c"])
  })

  it("selects the node holding the current match on request", () => {
    store.getState().setSelectedNode("c")
    search("price")
    store.getState().searchPrev()
    store.getState().selectCurrentSearchNode()

    expect(store.getState().selectedNodeIds).toEqual(["b"])
  })

  it("defers reordering until a node drag ends", () => {
    search("price")
    const beforeDrag = selectSearchMatches(store.getState())
    const drag = (dragging: boolean) =>
      store.getState().onNodesChange([
        {
          type: "position",
          id: "b",
          position: { x: 0, y: -100 },
          dragging,
        },
      ])

    drag(true)
    expect(store.getState().nodeDragOriginGraph).not.toBeNull()
    expect(selectSearchMatches(store.getState())).toBe(beforeDrag)

    drag(false)
    expect(store.getState().nodeDragOriginGraph).toBeNull()
    expect(selectSearchMatches(store.getState())[0]?.nodeId).toBe("b")
  })

  it("keeps a synced first match by identity when a match appears above it", () => {
    search("price")
    store.getState().syncSearchCurrentMatch()
    const first = selectCurrentSearchMatch(store.getState())

    store
      .getState()
      .onNodesChange([
        { type: "add", item: inline("z", -100, ["{{ price }}"]) },
      ])

    expect(selectCurrentSearchMatch(store.getState())?.key).toBe(first?.key)
    expect(selectSearchCurrentIndex(store.getState())).toBe(1)
  })

  it("stays on the successor after undoing the removal of the old match", () => {
    search("price")
    store.getState().searchNext()
    store.getState().searchNext()
    store.getState().deleteNodes(["b"])
    // The bar syncs whatever the recompute resolved the current match to.
    store.getState().syncSearchCurrentMatch()
    const successor = selectCurrentSearchMatch(store.getState())

    store.getState().undo()

    expect(selectCurrentSearchMatch(store.getState())?.key).toBe(successor?.key)
  })

  it("syncing is a no-op when the stored key is current", () => {
    search("price")
    store.getState().searchNext()
    const before = store.getState().search

    store.getState().syncSearchCurrentMatch()

    expect(store.getState().search).toBe(before)
  })

  it("keeps a reference in a later condition when an earlier one is removed", () => {
    const evaluator = createWorkflowNode(
      registry,
      "evaluator",
      { x: 0, y: 500 },
      "Check"
    )
    const condition = (id: string, left: string) => ({
      id,
      left: { type: "value", value: left },
      operator: "is equal to",
      right: { type: "value", value: "1" },
    })
    evaluator.data.config.conditions = [
      condition("first", "{{ price }}"),
      condition("second", "{{ price }}"),
    ]
    store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: graph([{ ...evaluator, id: "e" }]),
    })
    search("price")
    store.getState().searchNext()
    const current = selectCurrentSearchMatch(store.getState())
    expect(current?.fieldPath).toBe("conditions[second].left")

    store.getState().updateNodeConfig("e", {
      kind: "evaluator",
      key: "conditions",
      value: [condition("second", "{{ price }}")],
    })

    expect(selectSearchTotal(store.getState())).toBe(1)
    expect(selectCurrentSearchMatch(store.getState())?.key).toBe(current?.key)
  })

  it("returns the same match list while the graph and query are unchanged", () => {
    search("price")
    const first = selectSearchMatches(store.getState())
    store.getState().searchNext()

    expect(selectSearchMatches(store.getState())).toBe(first)
  })
})

describe("field search status", () => {
  function fieldStore() {
    const setter = createWorkflowNode(
      registry,
      "setVariable",
      { x: 0, y: 0 },
      "price source"
    )
    setter.data.config.variableName = "price"
    setter.data.config.valueExpression = "{{ amount }}"
    const evaluator = createWorkflowNode(
      registry,
      "evaluator",
      { x: 0, y: 100 },
      "Check"
    )
    evaluator.data.config.conditions = [
      {
        id: "c1",
        left: { type: "array", value: ["{{ a }}", "{{ price }}"] },
        operator: "is equal to",
        right: { type: "value", value: "1" },
      },
    ]
    return createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: graph([
        { ...setter, id: "s" },
        { ...evaluator, id: "e" },
      ]),
    })
  }

  function open(query: string) {
    store = fieldStore()
    store.getState().openSearch()
    store.getState().setSearchQuery(query)
  }

  const field = (nodeId: string, key: string, includeChildren?: boolean) =>
    selectFieldSearchStatus(store.getState(), nodeId, key, {
      includeChildren,
    })

  it("marks the title, the variable field and the reference field", () => {
    open("price")

    expect(field("s", SEARCH_TITLE_FIELD)).toBe("current")
    expect(field("s", "variableName")).toBe("match")
    expect(field("s", "valueExpression")).toBe("none")
    expect(field("e", "conditions[c1].left[1]")).toBe("match")
    expect(field("e", "conditions[c1].left[0]")).toBe("none")
  })

  it("moves the current mark between fields of one node", () => {
    open("price")
    store.getState().searchNext()

    expect(field("s", SEARCH_TITLE_FIELD)).toBe("match")
    expect(field("s", "variableName")).toBe("current")
  })

  it("rolls array entries up to their operand with includeChildren", () => {
    open("price")
    store.getState().searchNext()
    store.getState().searchNext()

    expect(field("e", "conditions[c1].left")).toBe("none")
    expect(field("e", "conditions[c1].left", true)).toBe("current")
    expect(field("e", "conditions[c1].right", true)).toBe("none")
  })

  it("reports whether the current match has a field of its own", () => {
    open("price")

    expect(selectNodeHasCurrentField(store.getState(), "s")).toBe(true)
    expect(selectNodeHasCurrentField(store.getState(), "e")).toBe(false)
  })

  it("answers none for every field while the search is closed", () => {
    open("price")
    store.getState().closeSearch()

    expect(field("s", SEARCH_TITLE_FIELD)).toBe("none")
    expect(field("e", "conditions[c1].left", true)).toBe("none")
  })

  it("does not roll a condition's operand up into a longer id's", () => {
    const evaluator = createWorkflowNode(
      registry,
      "evaluator",
      { x: 0, y: 0 },
      "Check"
    )
    const condition = (id: string, left: string) => ({
      id,
      left: { type: "array", value: [left] },
      operator: "is equal to",
      right: { type: "value", value: "1" },
    })
    evaluator.data.config.conditions = [
      condition("c1", "{{ a }}"),
      condition("c10", "{{ price }}"),
    ]
    store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: graph([{ ...evaluator, id: "e" }]),
    })
    store.getState().openSearch()
    store.getState().setSearchQuery("price")

    expect(field("e", "conditions[c10].left", true)).toBe("current")
    expect(field("e", "conditions[c1].left", true)).toBe("none")
  })

  it("gives repeated condition ids distinct match keys, so stepping passes both", () => {
    const evaluator = createWorkflowNode(
      registry,
      "evaluator",
      { x: 0, y: 0 },
      "Check"
    )
    const condition = {
      id: "same",
      left: { type: "value", value: "{{ price }}" },
      operator: "is equal to",
      right: { type: "value", value: "1" },
    }
    evaluator.data.config.conditions = [condition, { ...condition }]
    store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: graph([{ ...evaluator, id: "e" }]),
    })
    store.getState().openSearch()
    store.getState().setSearchQuery("price")
    const keys = selectSearchMatches(store.getState()).map((m) => m.key)

    expect(new Set(keys).size).toBe(2)
    store.getState().searchNext()
    expect(selectSearchCurrentIndex(store.getState())).toBe(1)
  })
})

describe("results panel, options and source filters", () => {
  function labeled(id: string, y: number, label: string): WorkflowNode {
    const node = createWorkflowNode(
      registry,
      "inlineExpression",
      { x: 0, y },
      label
    )
    node.data.config.template = ["{{ price }}"]
    return { ...node, id }
  }

  beforeEach(() => {
    // "price" hits: a's label (0), a's reference (1), b's reference (2).
    store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: graph([
        labeled("a", 0, "price"),
        labeled("b", 100, "Other"),
      ]),
    })
    search("price")
  })

  const referencesOnly = {
    label: false,
    "variable-definition": false,
    "variable-reference": true,
  } as const

  it("removes a disabled source from the total, stepping and marks", () => {
    store.getState().setSearchSources(referencesOnly)
    const state = store.getState()

    expect(selectSearchTotal(state)).toBe(2)
    expect(
      selectSearchMatches(state).every(
        (match) => match.source === "variable-reference"
      )
    ).toBe(true)
    expect(selectFieldSearchStatus(state, "a", SEARCH_TITLE_FIELD)).toBe("none")
    store.getState().searchNext()
    store.getState().searchNext()
    expect(selectSearchCurrentIndex(store.getState())).toBe(0)
  })

  it("drops a node's mark when its only match is filtered out", () => {
    const node = labeled("x", 0, "price")
    node.data.config.template = ["{{ amount }}"]
    store = createWorkflowStore({
      definitions: builtinBaseDefinitions,
      initialGraph: graph([node]),
    })
    search("price")
    expect(selectNodeSearchStatus(store.getState(), "x")).toBe("current")

    store.getState().setSearchSources({
      label: false,
      "variable-definition": true,
      "variable-reference": true,
    })

    expect(selectNodeSearchStatus(store.getState(), "x")).toBe("none")
  })

  it("filters without rescanning the graph", () => {
    const counts = selectSearchSourceCounts(store.getState())
    store.getState().setSearchSources(referencesOnly)

    expect(selectSearchSourceCounts(store.getState())).toBe(counts)
    expect(counts).toEqual({
      label: 1,
      "variable-definition": 0,
      "variable-reference": 2,
    })
    expect(selectSearchHiddenByFilters(store.getState())).toBe(1)
    expect(selectSearchIsFiltered(store.getState())).toBe(true)
  })

  it("moves a filtered-out current match to the nearest following one", () => {
    expect(selectCurrentSearchMatch(store.getState())?.source).toBe("label")

    store.getState().setSearchSources(referencesOnly)

    expect(selectCurrentSearchMatch(store.getState())).toMatchObject({
      nodeId: "a",
      source: "variable-reference",
    })
  })

  it("resets every source", () => {
    store.getState().setSearchSources(referencesOnly)
    store.getState().resetSearchSources()

    expect(selectSearchTotal(store.getState())).toBe(3)
    expect(selectSearchIsFiltered(store.getState())).toBe(false)
  })

  it("rebuilds the matches when an option changes", () => {
    store.getState().setSearchOption("matchCase", true)
    store.getState().setSearchQuery("Price")

    expect(selectSearchTotal(store.getState())).toBe(0)

    store.getState().setSearchOption("matchCase", false)
    expect(selectSearchTotal(store.getState())).toBe(3)
  })

  it("sets the current match by key without touching selection or history", () => {
    store.getState().setSelectedNode("b")
    const history = store.history.getState()
    const target = selectSearchMatches(store.getState())[2]!

    store.getState().setSearchCurrentMatch(target.key)

    expect(selectSearchCurrentIndex(store.getState())).toBe(2)
    expect(store.getState().search.currentSortTuple).toBe(target.sortTuple)
    expect(store.getState().selectedNodeIds).toEqual(["b"])
    expect(store.history.getState()).toBe(history)
  })

  it("ignores an unknown key", () => {
    const before = store.getState().search

    store.getState().setSearchCurrentMatch("missing")

    expect(store.getState().search).toBe(before)
  })

  it("keeps the panel, options and sources across close and reopen", () => {
    store.getState().toggleSearchResults()
    store.getState().setSearchOption("wholeWord", true)
    store.getState().setSearchSources(referencesOnly)

    store.getState().closeSearch()
    expect(store.getState().search).toMatchObject({
      isOpen: false,
      query: "",
      currentKey: null,
    })
    store.getState().openSearch()

    expect(store.getState().search).toMatchObject({
      isResultsOpen: true,
      options: { matchCase: false, wholeWord: true },
      sources: referencesOnly,
    })
  })

  it("does not notify subscribers when closing an already closed search", () => {
    store.getState().closeSearch()
    let notified = 0
    const unsubscribe = store.subscribe(() => {
      notified += 1
    })

    store.getState().closeSearch()
    unsubscribe()

    expect(notified).toBe(0)
  })
})
