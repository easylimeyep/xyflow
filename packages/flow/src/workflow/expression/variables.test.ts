import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry"
import type { WorkflowEdge } from "../types"
import { buildExpressionVariableCatalog } from "./variables"

describe("expression variable catalog", () => {
  it("includes current input helpers", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 }, "TriggerA")
    const transform = createWorkflowNode("transform", { x: 160, y: 0 }, "TransformA")
    const options = buildExpressionVariableCatalog([trigger, transform], [], transform.id)

    expect(options.some((option) => option.value === "$input.item.json")).toBe(true)
    expect(options.some((option) => option.value === "$input.first().json")).toBe(true)
  })

  it("includes reachable upstream nodes only", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 }, "TriggerA")
    const transform = createWorkflowNode("transform", { x: 200, y: 0 }, "TransformA")
    const code = createWorkflowNode("code", { x: 400, y: 0 }, "CodeA")
    const isolated = createWorkflowNode("customInput", { x: 0, y: 300 }, "Isolated")

    const edges: WorkflowEdge[] = [
      {
        id: "edge-1",
        source: trigger.id,
        target: transform.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: trigger.data.kind,
          targetKind: transform.data.kind,
        },
      },
      {
        id: "edge-2",
        source: transform.id,
        target: code.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: transform.data.kind,
          targetKind: code.data.kind,
        },
      },
    ]

    const options = buildExpressionVariableCatalog(
      [trigger, transform, code, isolated],
      edges,
      code.id
    )

    expect(options.some((option) => option.value.includes(`$node("${trigger.id}").item.json`))).toBe(
      true
    )
    expect(
      options.some((option) => option.value.includes(`$node("${transform.id}").item.json`))
    ).toBe(
      true
    )
    expect(options.some((option) => option.value.includes(`$node("${isolated.id}").item.json`))).toBe(
      false
    )
  })

  it("includes set variable outputs as $vars and node paths", () => {
    const trigger = createWorkflowNode("trigger", { x: 0, y: 0 }, "TriggerA")
    const setVariable = createWorkflowNode("setVariable", { x: 200, y: 0 }, "SetA")
    const code = createWorkflowNode("code", { x: 400, y: 0 }, "CodeA")
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
        target: code.id,
        sourceHandle: null,
        targetHandle: null,
        data: {
          sourceKind: setVariable.data.kind,
          targetKind: code.data.kind,
        },
      },
    ]

    const options = buildExpressionVariableCatalog([trigger, setVariable, code], edges, code.id)

    expect(options.some((option) => option.value === "$vars.regionName")).toBe(true)
    expect(
      options.some(
        (option) => option.value === `$node("${setVariable.id}").item.json.regionName`
      )
    ).toBe(true)
  })
})
