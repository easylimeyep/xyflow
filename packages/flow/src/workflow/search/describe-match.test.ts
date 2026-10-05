import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../node-registry/node-factory"
import { createNodeRegistry } from "../node-registry/registry"
import type { WorkflowNode } from "../types/types"
import { buildSnippet, describeSearchMatch } from "./describe-match"
import {
  buildSearchMatches as buildAllMatches,
  isNodeSearchMatch,
} from "./matches"

const buildSearchMatches = (...args: Parameters<typeof buildAllMatches>) =>
  buildAllMatches(...args).filter(isNodeSearchMatch)

const registry = createNodeRegistry(builtinBaseDefinitions)

function describeAll(node: WorkflowNode, query: string) {
  return buildSearchMatches([node], registry, query).map((match) =>
    describeSearchMatch(registry, node, match)
  )
}

describe("describeSearchMatch", () => {
  it("names a label match and snips the label", () => {
    const node = createWorkflowNode(
      registry,
      "inlineExpression",
      { x: 0, y: 0 },
      "Extract rate"
    )

    expect(describeAll(node, "rate")).toEqual([
      {
        fieldName: "Label",
        snippet: {
          before: "Extract ",
          hit: "rate",
          after: "",
          clippedStart: false,
          clippedEnd: false,
        },
      },
    ])
  })

  it("humanizes a definition field that has no schema label", () => {
    const node = createWorkflowNode(
      registry,
      "setVariable",
      { x: 0, y: 0 },
      "S"
    )
    node.data.config.variableName = "rate_value"

    expect(describeAll(node, "rate")[0]).toMatchObject({
      fieldName: "Variable name",
      snippet: { hit: "rate", after: "_value" },
    })
  })

  it("numbers an entry of a list of values", () => {
    const node = createWorkflowNode(
      registry,
      "inlineExpression",
      { x: 0, y: 0 },
      "Inline"
    )
    node.data.config.template = ["{{ other }}", "{{ rate.cur }}"]

    expect(describeAll(node, "rate")[0]).toMatchObject({
      fieldName: "Tokens #2",
      snippet: { before: "{{ ", hit: "rate", after: ".cur }}" },
    })
  })

  it("uses the kind's description for a nested operand", () => {
    const node = createWorkflowNode(registry, "evaluator", { x: 0, y: 0 }, "E")
    const condition = (id: string, value: string) => ({
      id,
      left: { type: "value", value },
      operator: "is equal to",
      right: { type: "value", value: "1" },
    })
    node.data.config.conditions = [
      condition("c1", "{{ other }}"),
      condition("c2", "{{ max(rate, 10) }}"),
    ]

    expect(describeAll(node, "rate")[0]).toMatchObject({
      fieldName: "Condition 2 · Left operand",
      snippet: { before: "{{ max(", hit: "rate", after: ", 10) }}" },
    })
  })

  it("falls back to a generic name for an undescribed nested path", () => {
    const node = createWorkflowNode(registry, "evaluator", { x: 0, y: 0 }, "E")
    const match = {
      ...buildSearchMatches([node], registry, "E")[0]!,
      source: "variable-reference" as const,
      fieldPath: "conditions#0",
    }

    expect(describeSearchMatch(registry, node, match).fieldName).toBe(
      "Expression"
    )
  })

  it("snips the right segment of a template with several", () => {
    const node = createWorkflowNode(
      registry,
      "inlineExpression",
      { x: 0, y: 0 },
      "Inline"
    )
    node.data.config.template = ["{{ a }} and {{ rate }}"]

    expect(describeAll(node, "rate")[0]!.snippet).toMatchObject({
      before: "{{ a }} and {{ ",
      hit: "rate",
      after: " }}",
    })
  })
})

describe("buildSnippet", () => {
  it("clips both ends and marks the cut", () => {
    const text = `${"a".repeat(40)}rate${"b".repeat(40)}`

    expect(buildSnippet(text, 40, 44)).toEqual({
      before: "a".repeat(24),
      hit: "rate",
      after: "b".repeat(24),
      clippedStart: true,
      clippedEnd: true,
    })
  })

  it("keeps the snippet on one line", () => {
    expect(buildSnippet("x\n  rate\ny", 4, 8)).toMatchObject({
      before: "x ",
      hit: "rate",
      after: " y",
    })
  })
})
