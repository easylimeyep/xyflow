import { parseTemplateSegments } from "@flow/expression-editor"

import type { NodeKind, NodeRegistry } from "../../node-registry/registry"
import type { JsonValue, WorkflowNode } from "../../types/types"

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
  return nodes.map((node) => {
    const expressionKeys = getRefactorableConfigKeys(registry, node)
    const refactorConfigValue = getDefinition(
      registry,
      node
    )?.refactorConfigValue
    if (expressionKeys.length === 0 && !refactorConfigValue) {
      return node
    }

    let configChanged = false
    const nextConfig = { ...node.data.config }
    const setConfigValue = (key: string, nextValue: JsonValue) => {
      nextConfig[key] = nextValue
      configChanged = true
    }

    expressionKeys.forEach((key) => {
      const value = nextConfig[key]
      if (typeof value === "string") {
        const nextValue = refactorExpression(value)
        if (nextValue !== value) {
          setConfigValue(key, nextValue)
        }
        return
      }

      if (
        !Array.isArray(value) ||
        !value.every((entry) => typeof entry === "string")
      ) {
        return
      }

      const nextValue = value.map((entry) => refactorExpression(entry))
      if (nextValue.some((entry, index) => entry !== value[index])) {
        setConfigValue(key, nextValue)
      }
    })

    if (refactorConfigValue) {
      Object.entries(nextConfig).forEach(([key, value]) => {
        const nextValue = refactorConfigValue(key, value, refactorExpression)
        if (nextValue !== value) {
          setConfigValue(key, nextValue)
        }
      })
    }

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

function getDefinition(registry: NodeRegistry, node: WorkflowNode) {
  return registry.get(node.data.kind as NodeKind)
}

function getRefactorableConfigKeys(
  registry: NodeRegistry,
  node: WorkflowNode
): string[] {
  const definition = getDefinition(registry, node)
  // A node whose kind is not registered has no declared fields, so nothing in
  // its config can be an expression to refactor.
  if (!definition) {
    return []
  }
  const fieldKeys = definition.fields
    .filter(
      (field) =>
        field.ui === "expression" &&
        (field.type === "text" || field.type === "textarea")
    )
    .map((field) => field.key)
  const templateLikeRenameKey =
    definition.renameConfigKey &&
    typeof node.data.config[definition.renameConfigKey] === "string" &&
    String(node.data.config[definition.renameConfigKey]).includes("{{")
      ? [definition.renameConfigKey]
      : []

  return [
    ...fieldKeys,
    ...(definition.extraExpressionConfigKeys ?? []),
    ...templateLikeRenameKey,
  ]
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
