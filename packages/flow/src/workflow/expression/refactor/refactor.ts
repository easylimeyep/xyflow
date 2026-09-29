import { parseTemplateSegments } from "@flow/expression-editor"

import type { NodeRegistry } from "../../node-registry/registry"
import type { WorkflowNode } from "../../types/types"
import { mapExpressionFields } from "./expression-fields"

export function refactorPlainVariableReferencesInGraph(
  registry: NodeRegistry,
  nodes: WorkflowNode[],
  oldName: string,
  newName: string
): WorkflowNode[] {
  const trimmedOldName = oldName.trim()
  const trimmedNewName = newName.trim()
  if (!trimmedOldName || trimmedOldName === trimmedNewName) {
    return nodes
  }
  return refactorExpressionFieldsInGraph(registry, nodes, (template) =>
    refactorPlainVariableInTemplate(template, trimmedOldName, trimmedNewName)
  )
}

function refactorPlainVariableInTemplate(
  template: string,
  oldName: string,
  newName: string
): string {
  const segments = parseTemplateSegments(template)
  return segments
    .map((segment) => {
      if (segment.type !== "expression") {
        return segment.value
      }
      const pattern = new RegExp(`\\b${escapeRegExp(oldName)}\\b`, "g")
      const newExpression = segment.value.replace(pattern, newName)
      if (segment.closed === false) {
        return `{{${newExpression}`
      }
      return `{{${newExpression}}}`
    })
    .join("")
}

function refactorExpressionFieldsInGraph(
  registry: NodeRegistry,
  nodes: WorkflowNode[],
  refactorExpression: (expression: string) => string
): WorkflowNode[] {
  return nodes.map((node) =>
    mapExpressionFields(registry, node, ({ template }) =>
      refactorExpression(template)
    )
  )
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
