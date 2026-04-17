import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../../node-registry/node-factory"
import { refactorPlainVariableReferencesInGraph } from "./refactor"

describe("plain variable refactor", () => {
  it("replaces plain identifier in expression segments across graph nodes", () => {
    const extractor = createWorkflowNode("extractor", { x: 0, y: 0 })
    extractor.data.config.extractExpression = "{{ price }}"

    const inline = createWorkflowNode("inlineExpression", { x: 100, y: 0 })
    inline.data.config.template = ["some text {{ price }} and more"]

    const nextNodes = refactorPlainVariableReferencesInGraph(
      [extractor, inline],
      "price",
      "cost"
    )

    const nextExtractor = nextNodes.find((n) => n.id === extractor.id)
    const nextInline = nextNodes.find((n) => n.id === inline.id)

    expect(nextExtractor?.data.config.extractExpression).toBe("{{ cost }}")
    expect(nextInline?.data.config.template).toEqual(["some text {{ cost }} and more"])
  })

  it("does not replace partial identifier matches", () => {
    const inline = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    inline.data.config.template = ["{{ priceList }}"]

    const nextNodes = refactorPlainVariableReferencesInGraph([inline], "price", "cost")

    const nextInline = nextNodes.find((n) => n.id === inline.id)
    expect(nextInline?.data.config.template).toEqual(["{{ priceList }}"])
  })

  it("does not replace identifier inside literal segments", () => {
    const inline = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    inline.data.config.template = ["the price is {{ price }}"]

    const nextNodes = refactorPlainVariableReferencesInGraph([inline], "price", "cost")

    const nextInline = nextNodes.find((n) => n.id === inline.id)
    expect(nextInline?.data.config.template).toEqual(["the price is {{ cost }}"])
  })

  it("replaces multiple occurrences in different expression segments", () => {
    const inline = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    inline.data.config.template = ["{{ price }} and {{ price }}"]

    const nextNodes = refactorPlainVariableReferencesInGraph([inline], "price", "cost")

    const nextInline = nextNodes.find((n) => n.id === inline.id)
    expect(nextInline?.data.config.template).toEqual(["{{ cost }} and {{ cost }}"])
  })

  it("rewrites each string entry in array-backed keyword templates", () => {
    const inline = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    inline.data.config.template = ["{{ price }}", "{{ untouched }}", "before {{ price }}"]

    const nextNodes = refactorPlainVariableReferencesInGraph([inline], "price", "cost")

    const nextInline = nextNodes.find((n) => n.id === inline.id)
    expect(nextInline?.data.config.template).toEqual([
      "{{ cost }}",
      "{{ untouched }}",
      "before {{ cost }}",
    ])
  })

  it("returns nodes unchanged when old and new names are equal", () => {
    const inline = createWorkflowNode("inlineExpression", { x: 0, y: 0 })
    inline.data.config.template = ["{{ price }}"]

    const nextNodes = refactorPlainVariableReferencesInGraph([inline], "price", "price")

    expect(nextNodes[0]).toBe(inline)
  })
})
