import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../node-registry/node-factory"
import { createNodeRegistry } from "../node-registry/registry"
import type { WorkflowNode } from "../types/types"
import { buildSearchMatches, reconcileCurrentMatch } from "./matches"

const registry = createNodeRegistry(builtinBaseDefinitions)

function setter(name: string, y = 0, x = 0): WorkflowNode {
  const node = createWorkflowNode(registry, "setVariable", { x, y }, "Setter")
  node.data.config.variableName = name
  node.data.config.valueExpression = "1"
  return node
}

function inline(template: string[], y = 0, x = 0, id?: string): WorkflowNode {
  const node = createWorkflowNode(
    registry,
    "inlineExpression",
    { x, y },
    "Inline"
  )
  node.data.config.template = template
  return id ? { ...node, id } : node
}

describe("buildSearchMatches", () => {
  it("reports label and definition matches for one node", () => {
    const node = createWorkflowNode(
      registry,
      "extractor",
      { x: 0, y: 0 },
      "Calc price"
    )
    node.data.config.extractExpression = "price"

    const matches = buildSearchMatches([node], registry, "price")

    expect(matches.map((match) => match.source)).toEqual([
      "label",
      "variable-definition",
    ])
    expect(matches.every((match) => match.nodeId === node.id)).toBe(true)
  })

  it("counts every reference occurrence separately", () => {
    const nodes = [
      setter("price", 0),
      inline(["{{ price }}"], 100),
      inline(["{{ price }} + {{price}}"], 200),
    ]

    const matches = buildSearchMatches(nodes, registry, "price")

    expect(matches).toHaveLength(4)
    expect(matches.map((match) => match.source)).toEqual([
      "variable-definition",
      "variable-reference",
      "variable-reference",
      "variable-reference",
    ])
  })

  it("ignores case", () => {
    const node = createWorkflowNode(
      registry,
      "inlineExpression",
      { x: 0, y: 0 },
      "Parse Response"
    )

    expect(buildSearchMatches([node], registry, "parse response")).toEqual([
      expect.objectContaining({ source: "label", start: 0, end: 14 }),
    ])
  })

  it("ignores literal text outside expressions", () => {
    const nodes = [inline(["price: {{amount}}"])]

    expect(buildSearchMatches(nodes, registry, "price")).toEqual([])
  })

  it("reports raw-template offsets for references", () => {
    const nodes = [inline(["a {{ x + price }}"])]

    const [match] = buildSearchMatches(nodes, registry, "price")

    expect(match).toMatchObject({
      source: "variable-reference",
      fieldPath: "template[0]",
      occurrence: 0,
      start: 9,
      end: 14,
    })
  })

  it.each(["", "   "])("returns nothing for the query %j", (query) => {
    expect(buildSearchMatches([setter("price")], registry, query)).toEqual([])
  })

  it("orders by canvas position, not creation order", () => {
    const lower = inline(["{{ price }}"], 300)
    const upperRight = inline(["{{ price }}"], 0, 500)
    const upperLeft = inline(["{{ price }}"], 0, 10)

    const matches = buildSearchMatches(
      [lower, upperRight, upperLeft],
      registry,
      "price"
    )

    expect(matches.map((match) => match.nodeId)).toEqual([
      upperLeft.id,
      upperRight.id,
      lower.id,
    ])
  })

  it("breaks position ties by node id", () => {
    const b = inline(["{{ price }}"], 0, 0, "b")
    const a = inline(["{{ price }}"], 0, 0, "a")

    const matches = buildSearchMatches([b, a], registry, "price")

    expect(matches.map((match) => match.nodeId)).toEqual(["a", "b"])
  })

  it("orders within a node by source, field, then offset", () => {
    const node = createWorkflowNode(
      registry,
      "inlineExpression",
      { x: 0, y: 0 },
      "price"
    )
    node.data.config.template = ["{{ price }} {{ price }}", "{{ price }}"]

    const matches = buildSearchMatches([node], registry, "price")

    expect(matches.map((match) => match.key)).toEqual([
      `${node.id}|label||0`,
      `${node.id}|variable-reference|template[0]|0`,
      `${node.id}|variable-reference|template[0]|1`,
      `${node.id}|variable-reference|template[1]|0`,
    ])
  })
})

describe("matching options", () => {
  const matchCase = { matchCase: true, wholeWord: false }
  const wholeWord = { matchCase: false, wholeWord: true }

  function labeled(label: string): WorkflowNode {
    return createWorkflowNode(
      registry,
      "inlineExpression",
      { x: 0, y: 0 },
      label
    )
  }

  it("matches case only when asked to", () => {
    const nodes = [labeled("Parse Response")]

    expect(buildSearchMatches(nodes, registry, "parse", matchCase)).toEqual([])
    expect(
      buildSearchMatches(nodes, registry, "Parse", matchCase)
    ).toHaveLength(1)
  })

  it("skips longer identifiers with whole word on", () => {
    const nodes = [inline(["{{rate}}", "{{max_rate}}", "{{rate2}}"])]

    const matches = buildSearchMatches(nodes, registry, "rate", wholeWord)

    expect(matches.map((match) => match.fieldPath)).toEqual(["template[0]"])
  })

  it("accepts property access as a word boundary", () => {
    const nodes = [inline(["{{ rate.value }}"])]

    expect(buildSearchMatches(nodes, registry, "rate", wholeWord)).toHaveLength(
      1
    )
  })

  it("keeps scanning past a rejected candidate", () => {
    const nodes = [inline(["{{ ratex + rate }}"])]

    expect(buildSearchMatches(nodes, registry, "rate", wholeWord)).toEqual([
      expect.objectContaining({ start: 11, end: 15, occurrence: 0 }),
    ])
  })

  it("treats letters of any script as word characters", () => {
    const nodes = [labeled("Курс валют"), labeled("Курсы")]

    const matches = buildSearchMatches(nodes, registry, "курс", wholeWord)

    expect(matches).toEqual([
      expect.objectContaining({ nodeId: nodes[0]!.id, start: 0, end: 4 }),
    ])
  })

  it("keeps the keys of matches that survive an option toggle", () => {
    const nodes = [inline(["{{rate}} {{max_rate}}"])]

    const loose = buildSearchMatches(nodes, registry, "rate")
    const strict = buildSearchMatches(nodes, registry, "rate", wholeWord)

    expect(strict.map((match) => match.key)).toEqual([loose[0]!.key])
  })
})

describe("variable-definition matches", () => {
  const definitionOf = (nodes: WorkflowNode[], query = "price") =>
    buildSearchMatches(nodes, registry, query).filter(
      (match) => match.source === "variable-definition"
    )

  it("anchors a setter's definition to its variable-name field", () => {
    expect(definitionOf([setter("price")])).toEqual([
      expect.objectContaining({ fieldPath: "variableName" }),
    ])
  })

  it("anchors an extractor's own name to its expression field", () => {
    const node = createWorkflowNode(
      registry,
      "extractor",
      { x: 0, y: 0 },
      "Extract"
    )
    node.data.config.extractExpression = "price"

    expect(definitionOf([node])).toEqual([
      expect.objectContaining({ fieldPath: "extractExpression" }),
    ])
  })

  it("drops an extractor name that falls back to the label", () => {
    const node = createWorkflowNode(
      registry,
      "extractor",
      { x: 0, y: 0 },
      "price"
    )
    node.data.config.extractExpression = ""

    const matches = buildSearchMatches([node], registry, "price")

    expect(matches.map((match) => match.source)).toEqual(["label"])
  })

  it("drops a path extractor's name, which is its label", () => {
    const node = createWorkflowNode(
      registry,
      "pathExtractor",
      { x: 0, y: 0 },
      "price"
    )

    const matches = buildSearchMatches([node], registry, "price")

    expect(matches.map((match) => match.source)).toEqual(["label"])
  })

  it("keeps a host kind's definition without a field when it cannot be located", () => {
    const hostRegistry = createNodeRegistry([
      {
        ...registry.get("inlineExpression")!,
        kind: "host",
        variable: (node) => ({ name: String(node.config.output) }),
      },
    ])
    const node: WorkflowNode = {
      id: "h",
      position: { x: 0, y: 0 },
      data: { kind: "host", label: "Host", config: { output: "price" } },
    }

    const matches = buildSearchMatches([node], hostRegistry, "price")

    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject({ source: "variable-definition" })
    expect(matches[0]?.fieldPath).toBeUndefined()
  })
})

describe("reconcileCurrentMatch", () => {
  const definition = setter("price", 100)

  it("keeps the current match when edits happen elsewhere", () => {
    const before = buildSearchMatches(
      [inline(["{{ price }}"], 0), definition],
      registry,
      "price"
    )
    const current = before[1]!
    const after = buildSearchMatches(
      [inline(["{{ price }}"], 0), definition, inline(["{{ price }}"], 500)],
      registry,
      "price"
    )

    const next = reconcileCurrentMatch(current.key, current.sortTuple, after)

    expect(next?.key).toBe(current.key)
    expect(after.indexOf(next!)).toBe(1)
    expect(after).toHaveLength(3)
  })

  it("moves to the nearest following match when the current is removed", () => {
    const top = inline(["{{ price }}"], 0)
    const bottom = inline(["{{ price }}"], 500)
    const before = buildSearchMatches(
      [top, definition, bottom],
      registry,
      "price"
    )
    const current = before[1]!

    const after = buildSearchMatches([top, bottom], registry, "price")
    const next = reconcileCurrentMatch(current.key, current.sortTuple, after)

    expect(next?.nodeId).toBe(bottom.id)
  })

  it("falls back to the first match when nothing follows", () => {
    const top = inline(["{{ price }}"], 0)
    const before = buildSearchMatches([top, definition], registry, "price")
    const current = before[1]!

    const next = reconcileCurrentMatch(
      current.key,
      current.sortTuple,
      buildSearchMatches([top], registry, "price")
    )

    expect(next?.nodeId).toBe(top.id)
  })

  it("returns null when nothing matches", () => {
    expect(reconcileCurrentMatch("k", null, [])).toBeNull()
  })

  it("starts at the first match without a previous one", () => {
    const matches = buildSearchMatches([definition], registry, "price")

    expect(reconcileCurrentMatch(null, null, matches)).toBe(matches[0])
  })
})
