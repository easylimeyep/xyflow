import { describe, expect, it } from "vitest"

import { createWorkflowNode } from "../../node-registry/node-factory"
import {
  refactorNodeReferencesInExpression,
  refactorVariableReferencesInExpression,
  refactorVariableReferencesInGraph,
} from "./refactor"

describe("expression variable refactor", () => {
  it("replaces both $vars and $node references in expression text", () => {
    const nodeLabel = "Concatenate"
    const source = [
      "{{ $vars.oldName }}",
      '{{ $node("Concatenate").item.json.oldName }}',
      "{{ $vars.oldNameSuffix }}",
    ].join(" ")

    const nextValue = refactorVariableReferencesInExpression(source, {
      sourceNodeLabel: nodeLabel,
      oldName: "oldName",
      newName: "newName",
    })

    expect(nextValue).toContain("$vars.newName")
    expect(nextValue).toContain('$node("Concatenate").item.json.newName')
    expect(nextValue).toContain("$vars.oldNameSuffix")
  })

  it("updates all expression config fields in graph nodes", () => {
    const setVariable = createWorkflowNode("setVariable", { x: 0, y: 0 })
    setVariable.data.config.variableName = "oldName"
    setVariable.data.config.valueExpression = "{{ $vars.oldName }}"

    const inlineExpression = createWorkflowNode("inlineExpression", { x: 100, y: 0 })
    inlineExpression.data.config.template = `{{ $node("${setVariable.data.label}").item.json.oldName }}`

    const nextNodes = refactorVariableReferencesInGraph([setVariable, inlineExpression], {
      sourceNodeLabel: setVariable.data.label,
      oldName: "oldName",
      newName: "newName",
    })
    const nextSetVariable = nextNodes.find((node) => node.id === setVariable.id)
    const nextInlineExpression = nextNodes.find((node) => node.id === inlineExpression.id)

    expect(nextSetVariable?.data.config.valueExpression).toBe("{{ $vars.newName }}")
    expect(nextInlineExpression?.data.config.template).toBe(
      `{{ $node("${setVariable.data.label}").item.json.newName }}`
    )
  })

  it("replaces node references by label in expression text", () => {
    const source = '{{ $node("Trigger").item.json.eventName }}'
    const nextValue = refactorNodeReferencesInExpression(source, {
      oldLabel: "Trigger",
      newLabel: "Trigger 2",
    })

    expect(nextValue).toBe('{{ $node("Trigger 2").item.json.eventName }}')
  })
})
