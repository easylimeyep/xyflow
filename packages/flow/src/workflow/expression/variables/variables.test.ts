import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../../node-registry/node-factory"
import type { WorkflowEdge } from "../../types/types"
import { buildExpressionVariableCatalog } from "./variables"

describe("expression variable catalog", () => {
  it("includes current input helpers", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 }, "TriggerA")
    const inline = createWorkflowNode("inlineExpression", { x: 160, y: 0 }, "InlineA")
    const options = buildExpressionVariableCatalog([trigger, inline], [], inline.id)

    expect(options.some((option) => option.value === "$input.item.json")).toBe(true)
    expect(options.some((option) => option.value === "$input.first().json")).toBe(true)
  })

  it("includes reachable upstream nodes only", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 }, "TriggerA")
    const inline = createWorkflowNode("inlineExpression", { x: 200, y: 0 }, "InlineA")
    const extractor = createWorkflowNode("extractor", { x: 400, y: 0 }, "ExtractorA")
    const isolated = createWorkflowNode("setVariable", { x: 0, y: 300 }, "Isolated")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: trigger.id,
        target: inline.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: trigger.data.kind,
          targetKind: inline.data.kind,
        },
      },
      {
        id: "edge-2",
        source: inline.id,
        target: extractor.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: inline.data.kind,
          targetKind: extractor.data.kind,
        },
      },
    ]

    const options = buildExpressionVariableCatalog(
      [trigger, inline, extractor, isolated],
      edges,
      extractor.id
    )

    expect(options.some((option) => option.value.includes(`$node("${trigger.data.label}").item.json`))).toBe(
      true
    )
    expect(
      options.some((option) => option.value.includes(`$node("${inline.data.label}").item.json`))
    ).toBe(
      true
    )
    expect(options.some((option) => option.value.includes(`$node("${isolated.data.label}").item.json`))).toBe(
      false
    )
  })

  it("includes set variable outputs as $vars and node paths", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 }, "TriggerA")
    const setVariable = createWorkflowNode("setVariable", { x: 200, y: 0 }, "SetA")
    const extractor = createWorkflowNode("extractor", { x: 400, y: 0 }, "ExtractorA")
    setVariable.data.config.variableName = "regionName"

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: trigger.id,
        target: setVariable.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: trigger.data.kind,
          targetKind: setVariable.data.kind,
        },
      },
      {
        id: "edge-2",
        source: setVariable.id,
        target: extractor.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: setVariable.data.kind,
          targetKind: extractor.data.kind,
        },
      },
    ]

    const options = buildExpressionVariableCatalog([trigger, setVariable, extractor], edges, extractor.id)

    expect(options.some((option) => option.value === "$vars.regionName")).toBe(true)
    expect(
      options.some(
        (option) => option.value === `$node("${setVariable.data.label}").item.json.regionName`
      )
    ).toBe(true)
  })
})
