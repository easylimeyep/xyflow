import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { createNodeRegistry } from "../../node-registry/registry"
import type { WorkflowNode } from "../../types/types"
import {
  forEachExpressionField,
  mapExpressionFields,
  type ExpressionField,
} from "./expression-fields"

const registry = createNodeRegistry(builtinBaseDefinitions)

function collectFields(node: WorkflowNode): ExpressionField[] {
  const fields: ExpressionField[] = []
  forEachExpressionField(registry, node, (field) => fields.push(field))
  return fields
}

describe("forEachExpressionField", () => {
  it("visits every entry of an expression-ui string array field", () => {
    const inline = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    inline.data.config.template = ["{{ a }}", "text {{ b }}"]

    expect(collectFields(inline)).toEqual([
      { fieldPath: "template[0]", template: "{{ a }}" },
      { fieldPath: "template[1]", template: "text {{ b }}" },
    ])
  })

  it("visits extra expression keys and a template-like rename key", () => {
    const setter = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    setter.data.config.valueExpression = "{{ price * 2 }}"
    setter.data.config.variableName = "{{ total }}"

    expect(collectFields(setter)).toEqual([
      { fieldPath: "valueExpression", template: "{{ price * 2 }}" },
      { fieldPath: "variableName", template: "{{ total }}" },
    ])
  })

  it("skips a rename key that holds a plain name", () => {
    const setter = createWorkflowNode(registry, "setVariable", { x: 0, y: 0 })
    setter.data.config.valueExpression = "1"
    setter.data.config.variableName = "total"

    expect(collectFields(setter).map((field) => field.fieldPath)).toEqual([
      "valueExpression",
    ])
  })

  it("reaches templates nested in evaluator conditions by condition id and side", () => {
    const evaluator = createWorkflowNode(registry, "evaluator", { x: 0, y: 0 })
    evaluator.data.config.conditions = [
      {
        id: "c1",
        left: { type: "value", value: "{{ price }}" },
        operator: "is equal to",
        right: { type: "array", value: ["{{ a }}", "{{ b }}"] },
      },
    ]

    expect(collectFields(evaluator)).toEqual([
      { fieldPath: "conditions[c1].left", template: "{{ price }}" },
      { fieldPath: "conditions[c1].right[0]", template: "{{ a }}" },
      { fieldPath: "conditions[c1].right[1]", template: "{{ b }}" },
    ])
  })

  it("visits nothing for a node whose kind is not registered", () => {
    const node = {
      id: "x",
      position: { x: 0, y: 0 },
      data: { kind: "unknown", label: "", config: { template: "{{ a }}" } },
    } as WorkflowNode

    expect(collectFields(node)).toEqual([])
  })
})

describe("structured values from a host kind", () => {
  const baseDefinition = registry.get("inlineExpression")!

  function hostNode(kind: string): WorkflowNode {
    return {
      id: `${kind}-1`,
      position: { x: 0, y: 0 },
      data: {
        kind,
        label: "",
        config: {
          rows: [
            { id: "r1", text: "{{ a }}" },
            { id: "r2", text: "{{ b }}" },
          ],
        },
      },
    }
  }

  function hostRegistry(kind: string, withPaths: boolean) {
    return createNodeRegistry([
      {
        ...baseDefinition,
        kind,
        fields: [],
        refactorConfigValue: (key, value, rewrite) => {
          if (key !== "rows" || !Array.isArray(value)) return value
          value.forEach((row) => {
            const { id, text } = row as { id: string; text: string }
            rewrite(text, withPaths ? `rows[${id}]` : undefined)
          })
          return value
        },
      },
    ])
  }

  it("uses the paths a host refactor reports", () => {
    const fields: ExpressionField[] = []
    forEachExpressionField(
      hostRegistry("hostWithPaths", true),
      hostNode("hostWithPaths"),
      (f) => fields.push(f)
    )

    expect(fields.map((field) => field.fieldPath)).toEqual([
      "rows[r1]",
      "rows[r2]",
    ])
  })

  it("falls back to positions when a host refactor reports none", () => {
    const fields: ExpressionField[] = []
    forEachExpressionField(
      hostRegistry("hostWithoutPaths", false),
      hostNode("hostWithoutPaths"),
      (f) => fields.push(f)
    )

    expect(fields.map((field) => field.fieldPath)).toEqual(["rows#0", "rows#1"])
  })
})

describe("mapExpressionFields", () => {
  it("returns the same node when no template changes", () => {
    const inline = createWorkflowNode(registry, "inlineExpression", {
      x: 0,
      y: 0,
    })
    inline.data.config.template = ["{{ a }}"]

    expect(mapExpressionFields(registry, inline, (f) => f.template)).toBe(
      inline
    )
  })
})
