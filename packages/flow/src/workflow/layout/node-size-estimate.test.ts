import { describe, expect, it } from "vitest"

import { builtinBaseDefinitions } from "../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../node-registry/node-factory"
import { createNodeRegistry, type NodeKind } from "../node-registry/registry"
import type { JsonObject, WorkflowNode } from "../types/types"
import { getEstimatedNodeHeight } from "./node-size-estimate"

const registry = createNodeRegistry(builtinBaseDefinitions)

function nodeOf(kind: NodeKind, config: JsonObject = {}): WorkflowNode {
  const node = createWorkflowNode(registry, kind, { x: 0, y: 0 })
  return {
    ...node,
    data: { ...node.data, config: { ...node.data.config, ...config } },
  }
}

// Heights measured in the browser on the built-in views; the estimate stands
// in for them until a node renders in full, so they should stay close.
describe("getEstimatedNodeHeight", () => {
  it.each<[NodeKind, JsonObject, number]>([
    ["extractor", {}, 195],
    ["pathExtractor", {}, 142],
    ["result", {}, 93],
    ["setVariable", { valueExpression: "{{ a }}" }, 201],
    ["jsonSetter", { valueExpression: "{{ a }}" }, 257],
    ["inlineExpression", { template: ["{{ a }}"] }, 178],
  ])("matches a measured %s", (kind, config, measured) => {
    expect(getEstimatedNodeHeight(nodeOf(kind, config))).toBeCloseTo(
      measured,
      0
    )
  })

  it("grows a setter by one editor line per expression line", () => {
    const oneLine = nodeOf("setVariable", { valueExpression: "a" })
    const threeLines = nodeOf("setVariable", { valueExpression: "a\nb\nc" })

    expect(
      getEstimatedNodeHeight(threeLines) - getEstimatedNodeHeight(oneLine)
    ).toBeCloseTo(2 * 16.8)
  })

  it("grows a keyword node by one row per template entry", () => {
    const four = nodeOf("inlineExpression", {
      template: ["{{ a }}", "{{ b }}", "{{ c }}", "{{ d }}"],
    })

    // Measured: 284px for four rows.
    expect(getEstimatedNodeHeight(four)).toBeCloseTo(284, 0)
  })

  it("matches a measured eighteen-line setter", () => {
    const setter = nodeOf("setVariable", {
      valueExpression: Array.from({ length: 18 }, () => "{{ a }}").join("\n"),
    })

    // Measured: 485px.
    expect(Math.abs(getEstimatedNodeHeight(setter) - 485)).toBeLessThan(2)
  })

  it("sizes an evaluator by its conditions", () => {
    const condition = { id: "c", left: {}, operator: "is", right: {} }
    const single = nodeOf("evaluator", { conditions: [condition] })
    const json = nodeOf("jsonEvaluator", { conditions: [condition] })

    expect(getEstimatedNodeHeight(single)).toBeCloseTo(215, 0)
    expect(getEstimatedNodeHeight(json)).toBeCloseTo(268, 0)
  })
})
