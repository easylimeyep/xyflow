import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../../node-registry/node-factory"
import { defineNode } from "../../node-registry/define-node"
import type { WorkflowEdge, WorkflowNode } from "../../types/types"
import { collectWorkflowVariables } from "./variables"
import { graphScope, upstreamScope } from "./variable-scope"
import type {
  VariableScopeNode,
  VariableScopeResolver,
} from "./variable-scope"
import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../../node-registry/registry"

const registry = createNodeRegistry(builtinBaseDefinitions)

function node(kind: string, label: string): WorkflowNode {
  return createWorkflowNode(registry, kind, { x: 0, y: 0 }, label)
}

function connect(
  source: WorkflowNode,
  target: WorkflowNode,
  sourceHandle: string | null = null
): WorkflowEdge {
  return {
    id: `edge-${source.id}-${target.id}`,
    source: source.id,
    target: target.id,
    sourceHandle,
    targetHandle: null,
    data: { sourceKind: source.data.kind, targetKind: target.data.kind },
  }
}

function names(options: { value: string }[]): string[] {
  return options.map((option) => option.value)
}

describe("collectWorkflowVariables", () => {
  it("returns an empty catalog when no node is selected", () => {
    const inline = node("inlineExpression", "InlineA")

    const catalog = collectWorkflowVariables(
      registry,
      upstreamScope,
      [inline],
      [],
      null
    )

    expect(catalog.options).toHaveLength(0)
    expect(catalog.types).toEqual({})
  })

  it("exposes upstream extractor extractExpression as plain variable", () => {
    const extractor = node("extractor", "Extractor Title")
    extractor.data.config.extractExpression = "price"
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [extractor, inline],
      [connect(extractor, inline)],
      inline.id
    )

    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe("price")
    expect(options[0]?.label).toBe("price")
  })

  it("falls back to extractor label when extractExpression is invalid", () => {
    const extractor = node("extractor", "fallbackLabel")
    extractor.data.config.extractExpression = "{{ invalid }}"
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [extractor, inline],
      [connect(extractor, inline)],
      inline.id
    )

    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe("fallbackLabel")
  })

  it("exposes upstream setVariable variableName as plain variable", () => {
    const setVar = node("setVariable", "Setter")
    setVar.data.config.variableName = "total"
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [setVar, inline],
      [connect(setVar, inline)],
      inline.id
    )

    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe("total")
  })

  it("does not expose setVariable when variableName is missing", () => {
    const setVar = node("setVariable", "fallbackLabel")
    setVar.data.config.variableName = ""
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [setVar, inline],
      [connect(setVar, inline)],
      inline.id
    )

    expect(options).toHaveLength(0)
  })

  it("does not expose other node kinds as variables", () => {
    const inline = node("inlineExpression", "InlineA")
    const inline2 = node("inlineExpression", "InlineB")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [inline, inline2],
      [connect(inline, inline2)],
      inline2.id
    )

    expect(options).toHaveLength(0)
  })

  it("exposes upstream evaluator label as plain variable", () => {
    const evaluator = node("evaluator", "Evaluator")
    evaluator.data.config.label = "conditionMatched"
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [evaluator, inline],
      [connect(evaluator, inline, "evaluator-true")],
      inline.id
    )

    expect(options).toHaveLength(1)
    expect(options[0]?.value).toBe("conditionMatched")
  })

  it("does not expose empty upstream evaluator label", () => {
    const evaluator = node("evaluator", "Evaluator")
    evaluator.data.config.label = ""
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [evaluator, inline],
      [connect(evaluator, inline, "evaluator-true")],
      inline.id
    )

    expect(names(options)).not.toContain("")
    expect(names(options)).not.toContain("conditionMatched")
  })

  it("does not expose non-upstream evaluator labels", () => {
    const evaluator = node("evaluator", "Evaluator")
    evaluator.data.config.label = "conditionMatched"
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [evaluator, inline],
      [],
      inline.id
    )

    expect(names(options)).not.toContain("conditionMatched")
  })

  it("only includes upstream nodes, not isolated ones", () => {
    const extractor = node("extractor", "price")
    const isolated = node("extractor", "isolated")
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [extractor, isolated, inline],
      [connect(extractor, inline)],
      inline.id
    )

    expect(names(options)).toContain("price")
    expect(names(options)).not.toContain("isolated")
  })

  it("does not include $input or $node style variables", () => {
    const extractor = node("extractor", "price")
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [extractor, inline],
      [connect(extractor, inline)],
      inline.id
    )

    expect(options.every((option) => !option.value.includes("$input"))).toBe(
      true
    )
    expect(options.every((option) => !option.value.includes("$node"))).toBe(
      true
    )
    expect(options.every((option) => !option.value.includes("$vars"))).toBe(
      true
    )
  })

  it("returns upstream producer variable types by variable name", () => {
    const extractor = node("extractor", "Extractor")
    extractor.data.config.extractExpression = "items"
    extractor.data.config.variableType = "array"

    const setter = node("setVariable", "Setter")
    setter.data.config.variableName = "status"
    setter.data.config.variableType = "value"

    const inline = node("inlineExpression", "InlineA")

    const { types } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [extractor, setter, inline],
      [connect(extractor, setter), connect(setter, inline)],
      inline.id
    )

    expect(types).toEqual({ items: "array", status: "value" })
  })
})

describe("collectWorkflowVariables producer discovery", () => {
  // Regression guard: `pathExtractor` had a reader but was missing from the
  // hardcoded producer list, so its variables never reached autocomplete.
  it("exposes an upstream pathExtractor under its node label", () => {
    const pathExtractor = node("pathExtractor", "city")
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [pathExtractor, inline],
      [connect(pathExtractor, inline)],
      inline.id
    )

    expect(names(options)).toContain("city")
  })

  it("tags a pathExtractor producing a collection as an array", () => {
    const pathExtractor = node("pathExtractor", "cities")
    pathExtractor.data.config.outputType = "arrayObject"
    const inline = node("inlineExpression", "InlineA")

    const { types } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [pathExtractor, inline],
      [connect(pathExtractor, inline)],
      inline.id
    )

    expect(types.cities).toBe("array")
  })

  it("ignores a kind whose definition declares no variable reader", () => {
    const hostRegistry = createNodeRegistry([
      ...builtinBaseDefinitions,
      defineNode({
        kind: "hostSilent",
        title: "Silent",
        description: "Produces nothing.",
        icon: builtinBaseDefinitions[0]!.icon,
        category: "data",
        fields: [],
        outputPaths: [],
        allowedTargets: ["inlineExpression"],
        buildDefaultConfig: () => ({}),
      }),
    ])

    const silent = createWorkflowNode(
      hostRegistry,
      "hostSilent",
      { x: 0, y: 0 },
      "silentLabel"
    )
    const inline = createWorkflowNode(
      hostRegistry,
      "inlineExpression",
      { x: 200, y: 0 },
      "InlineA"
    )

    const { options } = collectWorkflowVariables(
      hostRegistry,
      upstreamScope,
      [silent, inline],
      [connect(silent, inline)],
      inline.id
    )

    expect(options).toHaveLength(0)
  })

  it("carries a host-defined type tag through untouched", () => {
    const hostRegistry = createNodeRegistry([
      ...builtinBaseDefinitions,
      defineNode({
        kind: "hostJson",
        title: "Host JSON",
        description: "Produces a json-tagged variable.",
        icon: builtinBaseDefinitions[0]!.icon,
        category: "data",
        fields: [],
        outputPaths: [],
        allowedTargets: ["inlineExpression"],
        buildDefaultConfig: () => ({}),
        variable: (source) => ({ name: source.label, type: "json" }),
      }),
    ])

    const producer = createWorkflowNode(
      hostRegistry,
      "hostJson",
      { x: 0, y: 0 },
      "payload"
    )
    const inline = createWorkflowNode(
      hostRegistry,
      "inlineExpression",
      { x: 200, y: 0 },
      "InlineA"
    )

    const { types } = collectWorkflowVariables(
      hostRegistry,
      upstreamScope,
      [producer, inline],
      [connect(producer, inline)],
      inline.id
    )

    expect(types.payload).toBe("json")
  })
})

describe("collectWorkflowVariables scope injection", () => {
  it("offers a disconnected producer under graphScope", () => {
    const setVar = node("setVariable", "Setter")
    setVar.data.config.variableName = "userId"
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      graphScope,
      [setVar, inline],
      [],
      inline.id
    )

    expect(names(options)).toContain("userId")
  })

  it("hides that same disconnected producer under upstreamScope", () => {
    const setVar = node("setVariable", "Setter")
    setVar.data.config.variableName = "userId"
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [setVar, inline],
      [],
      inline.id
    )

    expect(options).toHaveLength(0)
  })

  it("never offers a node its own variable under graphScope", () => {
    const setVar = node("setVariable", "Setter")
    setVar.data.config.variableName = "ownName"
    const other = node("setVariable", "Other")
    other.data.config.variableName = "otherName"

    const { options } = collectWorkflowVariables(
      registry,
      graphScope,
      [setVar, other],
      [],
      setVar.id
    )

    expect(names(options)).toEqual(["otherName"])
  })

  it("drops the selected node even when a resolver insists on it", () => {
    const setVar = node("setVariable", "Setter")
    setVar.data.config.variableName = "ownName"
    const hostileScope: VariableScopeResolver = ({ nodeId }) => [nodeId]

    const { options } = collectWorkflowVariables(
      registry,
      hostileScope,
      [setVar],
      [],
      setVar.id
    )

    expect(options).toHaveLength(0)
  })

  // One projection is shared across a whole rebuild, so a resolver that
  // reorders or rewrites it would corrupt the catalogs of every node walked
  // after it — invisibly, since the structural signature ignores the order
  // `graph.nodes` is iterated in.
  it("hands the resolver a projection it cannot mutate", () => {
    const setVar = node("setVariable", "Setter")
    setVar.data.config.variableName = "total"
    const inline = node("inlineExpression", "InlineA")

    const sortingScope: VariableScopeResolver = ({ nodes }) => {
      const mutable = nodes as VariableScopeNode[]
      expect(() => mutable.sort()).toThrow(TypeError)
      expect(() => {
        const first = mutable[0]
        if (first) first.label = "hijacked"
      }).toThrow(TypeError)
      return nodes.map((entry) => entry.id)
    }

    const { options } = collectWorkflowVariables(
      registry,
      sortingScope,
      [setVar, inline],
      [],
      inline.id
    )

    expect(options[0]?.description).toBe('Variable from "Setter" node.')
  })

  it("ignores ids a resolver returns that are not on the canvas", () => {
    const setVar = node("setVariable", "Setter")
    setVar.data.config.variableName = "total"
    const inline = node("inlineExpression", "InlineA")
    const staleScope: VariableScopeResolver = () => ["deleted-node", setVar.id]

    const { options } = collectWorkflowVariables(
      registry,
      staleScope,
      [setVar, inline],
      [],
      inline.id
    )

    expect(names(options)).toEqual(["total"])
  })

  it("terminates on a cyclic graph under upstreamScope", () => {
    const first = node("setVariable", "First")
    first.data.config.variableName = "first"
    const second = node("setVariable", "Second")
    second.data.config.variableName = "second"

    const { options } = collectWorkflowVariables(
      registry,
      upstreamScope,
      [first, second],
      [connect(first, second), connect(second, first)],
      first.id
    )

    expect(names(options)).toEqual(["second"])
  })
})

describe("collectWorkflowVariables duplicate names", () => {
  it("collapses a name produced by several nodes into one option", () => {
    const first = node("setVariable", "A")
    first.data.config.variableName = "user"
    const second = node("setVariable", "B")
    second.data.config.variableName = "user"
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      graphScope,
      [first, second, inline],
      [],
      inline.id
    )

    expect(options).toHaveLength(1)
    expect(options[0]?.description).toBe('Variable from "A", "B".')
  })

  it("keeps the single-source wording when only one node produces a name", () => {
    const only = node("setVariable", "A")
    only.data.config.variableName = "user"
    const inline = node("inlineExpression", "InlineA")

    const { options } = collectWorkflowVariables(
      registry,
      graphScope,
      [only, inline],
      [],
      inline.id
    )

    expect(options[0]?.description).toBe('Variable from "A" node.')
  })

  // An evaluator reports a name but no tag. It must not squat the tag slot:
  // a later source that does know the type has to be able to fill it, or the
  // evaluator UI paints a live variable as an unresolved reference.
  it("takes the tag from a later source when the first reports none", () => {
    const evaluator = node("evaluator", "A Check")
    evaluator.data.config.label = "flag"
    const setVar = node("setVariable", "B Setter")
    setVar.data.config.variableName = "flag"
    setVar.data.config.variableType = "array"
    const inline = node("inlineExpression", "InlineA")

    const { types } = collectWorkflowVariables(
      registry,
      graphScope,
      [evaluator, setVar, inline],
      [],
      inline.id
    )

    expect(types.flag).toBe("array")
  })

  // Equal labels survive import even though `deduplicateNodeLabels` makes them
  // rare when authoring, so the winner must not depend on traversal order.
  it("breaks a label tie by node id rather than by resolver order", () => {
    const first = node("setVariable", "Same")
    first.data.config.variableName = "user"
    first.data.config.variableType = "value"
    const second = node("setVariable", "Same")
    second.data.config.variableName = "user"
    second.data.config.variableType = "array"
    const inline = node("inlineExpression", "InlineA")

    // The same three nodes, only the order the resolver walks them differs.
    const tagFor = (producers: typeof first[]) =>
      collectWorkflowVariables(
        registry,
        graphScope,
        [...producers, inline],
        [],
        inline.id
      ).types.user

    expect(tagFor([first, second])).toBe(tagFor([second, first]))
  })

  // A blank tag is no tag. If it could claim the slot it would be dropped at
  // emit time anyway, silently taking the real tag down with it.
  it("does not let a blank tag from the first source block a real one", () => {
    const hostRegistry = createNodeRegistry([
      ...builtinBaseDefinitions,
      defineNode({
        kind: "hostBlank",
        title: "Blank tag",
        description: "Reports a name with an empty tag.",
        icon: builtinBaseDefinitions[0]!.icon,
        category: "data",
        fields: [],
        outputPaths: [],
        allowedTargets: ["inlineExpression"],
        buildDefaultConfig: () => ({}),
        variable: () => ({ name: "user", type: "  " }),
      }),
    ])

    const blank = createWorkflowNode(
      hostRegistry,
      "hostBlank",
      { x: 0, y: 0 },
      "A Blank"
    )
    const typed = createWorkflowNode(
      hostRegistry,
      "setVariable",
      { x: 120, y: 0 },
      "B Typed"
    )
    typed.data.config.variableName = "user"
    typed.data.config.variableType = "array"
    const inline = createWorkflowNode(
      hostRegistry,
      "inlineExpression",
      { x: 240, y: 0 },
      "InlineA"
    )

    const { types } = collectWorkflowVariables(
      hostRegistry,
      graphScope,
      [blank, typed, inline],
      [],
      inline.id
    )

    expect(types.user).toBe("array")
  })

  it("gives the type tag to the first source in label order", () => {
    const first = node("setVariable", "A")
    first.data.config.variableName = "user"
    first.data.config.variableType = "value"
    const second = node("setVariable", "B")
    second.data.config.variableName = "user"
    second.data.config.variableType = "array"
    const inline = node("inlineExpression", "InlineA")

    const { types } = collectWorkflowVariables(
      registry,
      graphScope,
      [second, first, inline],
      [],
      inline.id
    )

    expect(types.user).toBe("value")
  })
})

describe("variable scope resolvers", () => {
  it("graphScope returns every node on the canvas", () => {
    const first = node("setVariable", "A")
    const second = node("setVariable", "B")
    const third = node("inlineExpression", "C")

    const scoped = graphScope({
      nodes: [first, second, third].map((entry) => ({
        id: entry.id,
        kind: entry.data.kind,
        label: entry.data.label,
        config: entry.data.config,
      })),
      edges: [],
      nodeId: third.id,
    })

    expect(scoped).toHaveLength(3)
  })

  it("upstreamScope reaches transitively but not downstream", () => {
    const first = node("setVariable", "A")
    const second = node("setVariable", "B")
    const third = node("inlineExpression", "C")

    const scoped = upstreamScope({
      nodes: [],
      edges: [
        { source: first.id, target: second.id },
        { source: second.id, target: third.id },
      ],
      nodeId: second.id,
    })

    expect(scoped).toEqual([first.id])
  })
})
