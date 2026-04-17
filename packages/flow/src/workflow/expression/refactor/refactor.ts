import { getNodeDefinition, type NodeKind } from "../../node-registry/registry"
import { parseTemplateSegments } from "../template/template"
import type { WorkflowNode } from "../../types/types"

export function refactorPlainVariableReferencesInGraph(
  nodes: WorkflowNode[],
  oldName: string,
  newName: string
): WorkflowNode[] {
  const trimmedOldName = oldName.trim()
  const trimmedNewName = newName.trim()
  if (!trimmedOldName || trimmedOldName === trimmedNewName) {
    return nodes
  }
  return refactorExpressionFieldsInGraph(nodes, (template) =>
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
  nodes: WorkflowNode[],
  refactorExpression: (expression: string) => string
): WorkflowNode[] {
  return nodes.map((node) => {
    const expressionKeys = getRefactorableConfigKeys(node)
    if (expressionKeys.length === 0) {
      return node
    }

    let configChanged = false
    const nextConfig = { ...node.data.config }
    expressionKeys.forEach((key) => {
      const value = nextConfig[key]
      if (typeof value === "string") {
        const nextValue = refactorExpression(value)
        if (nextValue === value) {
          return
        }

        nextConfig[key] = nextValue
        configChanged = true
        return
      }

      if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
        return
      }

      const nextValue = value.map((entry) => refactorExpression(entry))
      if (nextValue.every((entry, index) => entry === value[index])) {
        return
      }

      nextConfig[key] = nextValue
      configChanged = true
    })

    if (!configChanged) {
      return node
    }

    return {
      ...node,
      data: {
        ...node.data,
        config: nextConfig,
      },
    }
  })
}

function getRefactorableConfigKeys(node: WorkflowNode): string[] {
  const kind = node.data.kind as NodeKind
  const definition = getNodeDefinition(kind)
  const fieldKeys = definition.fields
    .filter((field) => field.ui === "expression" && (field.type === "text" || field.type === "textarea"))
    .map((field) => field.key)
  const templateLikeRenameKey =
    definition.renameConfigKey &&
    typeof node.data.config[definition.renameConfigKey] === "string" &&
    String(node.data.config[definition.renameConfigKey]).includes("{{")
      ? [definition.renameConfigKey]
      : []

  return [...fieldKeys, ...(definition.extraExpressionConfigKeys ?? []), ...templateLikeRenameKey]
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
