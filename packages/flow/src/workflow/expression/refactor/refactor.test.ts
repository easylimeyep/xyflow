import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../../node-registry/node-factory"
import { refactorPlainVariableReferencesInGraph } from "./refactor"
import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createNodeRegistry } from "../../node-registry/registry"

const registry = createNodeRegistry(builtinBaseDefinitions)

describe("plain variable refactor", () => {
  it("replaces plain identifier in expression segments across graph nodes", () => {
    const extractor = createWorkflowNode(registry, "extractor", { x: 0, y: 0 })
    extractor.data.config.extractExpression = "{{ price }}"

    const inline = createWorkflowNode(registry, "inlineExpression", {
      x: 100,
      y: 0,
    })
    inline.data.config.template = ["some text {{ price }} and more"]

    const nextNodes = refactorPlainVariableReferencesInGraph(
      registry,
      [extractor, inline],
      "price",
      "cost"
    )

    const nextExtractor = nextNodes.find((n) => n.id === extractor.id)
    const nextInline = nextNodes.find((n) => n.id === inline.id)

    expect(nextExtractor?.data.config.extractExpression).toBe("{{ cost }}")
    expect(nextInline?.data.config.template).toEqual([
      "some text {{ cost }} and more",
    ])
  })

  it("does not replace partial identifier matches", () => {
    const inline = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    inline.data.config.template = ["{{ priceList }}"]

    const nextNodes = refactorPlainVariableReferencesInGraph(
      registry,
      [inline],
      "price",
      "cost"
    )

    const nextInline = nextNodes.find((n) => n.id === inline.id)
    expect(nextInline?.data.config.template).toEqual(["{{ priceList }}"])
  })

  it("does not replace identifier inside literal segments", () => {
    const inline = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    inline.data.config.template = ["the price is {{ price }}"]

    const nextNodes = refactorPlainVariableReferencesInGraph(
      registry,
      [inline],
      "price",
      "cost"
    )

    const nextInline = nextNodes.find((n) => n.id === inline.id)
    expect(nextInline?.data.config.template).toEqual([
      "the price is {{ cost }}",
    ])
  })

  it("replaces multiple occurrences in different expression segments", () => {
    const inline = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    inline.data.config.template = ["{{ price }} and {{ price }}"]

    const nextNodes = refactorPlainVariableReferencesInGraph(
      registry,
      [inline],
      "price",
      "cost"
    )

    const nextInline = nextNodes.find((n) => n.id === inline.id)
    expect(nextInline?.data.config.template).toEqual([
      "{{ cost }} and {{ cost }}",
    ])
  })

  it("rewrites each string entry in array-backed keyword templates", () => {
    const inline = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    inline.data.config.template = [
      "{{ price }}",
      "{{ untouched }}",
      "before {{ price }}",
    ]

    const nextNodes = refactorPlainVariableReferencesInGraph(
      registry,
      [inline],
      "price",
      "cost"
    )

    const nextInline = nextNodes.find((n) => n.id === inline.id)
    expect(nextInline?.data.config.template).toEqual([
      "{{ cost }}",
      "{{ untouched }}",
      "before {{ cost }}",
    ])
  })

  it("returns nodes unchanged when old and new names are equal", () => {
    const inline = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    inline.data.config.template = ["{{ price }}"]

    const nextNodes = refactorPlainVariableReferencesInGraph(
      registry,
      [inline],
      "price",
      "price"
    )

    expect(nextNodes[0]).toBe(inline)
  })
})

describe("structured config value refactor", () => {
  it.each(["evaluator", "jsonEvaluator"] as const)(
    "rewrites %s condition operands, including array rows",
    (kind) => {
      const node = createWorkflowNode(registry, kind, { x: 0, y: 0 })
      node.data.config.conditions = [
        {
          id: "c1",
          left: { type: "value", value: "{{ city }}" },
          operator: "is one of",
          right: {
            type: "array",
            value: ["Moscow", "{{ city }}", "prefix-{{ city }}"],
          },
        },
      ]

      const [nextNode] = refactorPlainVariableReferencesInGraph(
        registry,
        [node],
        "city",
        "town"
      )

      expect(nextNode?.data.config.conditions).toEqual([
        {
          id: "c1",
          left: { type: "value", value: "{{ town }}" },
          operator: "is one of",
          right: {
            type: "array",
            value: ["Moscow", "{{ town }}", "prefix-{{ town }}"],
          },
        },
      ])
      expect(node.data.config.conditions).toMatchObject([
        { left: { value: "{{ city }}" } },
      ])
    }
  )

  it("returns an evaluator unchanged when no condition references the name", () => {
    const node = createWorkflowNode(registry, "evaluator", { x: 0, y: 0 })

    const [nextNode] = refactorPlainVariableReferencesInGraph(
      registry,
      [node],
      "city",
      "town"
    )

    expect(nextNode).toBe(node)
  })

  it("leaves a structured value alone on a kind that declares no rewrite", () => {
    const extractor = createWorkflowNode(registry, "extractor", { x: 0, y: 0 })
    extractor.data.config.nested = { template: "{{ city }}" }

    const [nextNode] = refactorPlainVariableReferencesInGraph(
      registry,
      [extractor],
      "city",
      "town"
    )

    expect(nextNode).toBe(extractor)
  })
})
