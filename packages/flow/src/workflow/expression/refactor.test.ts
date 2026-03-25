import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../node-registry"
import {
  refactorVariableReferencesInExpression,
  refactorVariableReferencesInGraph,
} from "./refactor"

describe("expression variable refactor", () => {
  it("replaces both $vars and $node references in expression text", () => {
    const nodeId = "setVariable-1"
    const source = [
      "{{ $vars.oldName }}",
      "{{ $node(\"setVariable-1\").item.json.oldName }}",
      "{{ $vars.oldNameSuffix }}",
    ].join(" ")

    const nextValue = refactorVariableReferencesInExpression(source, {
      sourceNodeId: nodeId,
      oldName: "oldName",
      newName: "newName",
    })

    expect(nextValue).toContain("$vars.newName")
    expect(nextValue).toContain('$node("setVariable-1").item.json.newName')
    expect(nextValue).toContain("$vars.oldNameSuffix")
  })

  it("updates all expression config fields in graph nodes", () => {
    const setVariable = createWorkflowNode("setVariable", { x: 0, y: 0 })
    setVariable.data.config.variableName = "oldName"
    setVariable.data.config.valueExpression = "{{ $vars.oldName }}"

    const inlineExpression = createWorkflowNode("inlineExpression", { x: 100, y: 0 })
    inlineExpression.data.config.template = `{{ $node("${setVariable.id}").item.json.oldName }}`

    const nextNodes = refactorVariableReferencesInGraph([setVariable, inlineExpression], {
      sourceNodeId: setVariable.id,
      oldName: "oldName",
      newName: "newName",
    })
    const nextSetVariable = nextNodes.find((node) => node.id === setVariable.id)
    const nextInlineExpression = nextNodes.find((node) => node.id === inlineExpression.id)

    expect(nextSetVariable?.data.config.valueExpression).toBe("{{ $vars.newName }}")
    expect(nextInlineExpression?.data.config.template).toBe(
      `{{ $node("${setVariable.id}").item.json.newName }}`
    )
  })
})
