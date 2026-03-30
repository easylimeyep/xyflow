import { getNodeDefinition, type NodeKind } from "../../node-registry/registry"
import type { WorkflowNode } from "../../types/types"
import { buildNodeReference } from "../variables/variables"

interface VariableRenameContext {
  sourceNodeLabel: string
  oldName: string
  newName: string
}

interface NodeLabelRenameContext {
  oldLabel: string
  newLabel: string
}

export function refactorVariableReferencesInGraph(
  nodes: WorkflowNode[],
  context: VariableRenameContext
): WorkflowNode[] {
  return refactorExpressionFieldsInGraph(nodes, (expression) =>
    refactorVariableReferencesInExpression(expression, context)
  )
}

export function refactorNodeReferencesInGraph(
  nodes: WorkflowNode[],
  context: NodeLabelRenameContext
): WorkflowNode[] {
  return refactorExpressionFieldsInGraph(nodes, (expression) =>
    refactorNodeReferencesInExpression(expression, context)
  )
}

function refactorExpressionFieldsInGraph(
  nodes: WorkflowNode[],
  refactorExpression: (expression: string) => string
): WorkflowNode[] {
  return nodes.map((node) => {
    const expressionKeys = getExpressionConfigKeys(node.data.kind as NodeKind)
    if (expressionKeys.length === 0) {
      return node
    }

    let configChanged = false
    const nextConfig = { ...node.data.config }
    expressionKeys.forEach((key) => {
      const value = nextConfig[key]
      if (typeof value !== "string") {
        return
      }

      const nextValue = refactorExpression(value)
      if (nextValue === value) {
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

export function refactorVariableReferencesInExpression(
  expression: string,
  context: VariableRenameContext
): string {
  const trimmedOldName = context.oldName.trim()
  const trimmedNewName = context.newName.trim()
  if (!trimmedOldName || trimmedOldName === trimmedNewName) {
    return expression
  }

  const escapedOldName = escapeRegExp(trimmedOldName)
  const escapedNodeReference = escapeRegExp(buildNodeReference(context.sourceNodeLabel))

  const globalVariablePattern = new RegExp(`\\$vars\\.${escapedOldName}(?![\\w$])`, "g")
  const nodeVariablePattern = new RegExp(
    `${escapedNodeReference}\\.item\\.json\\.${escapedOldName}(?![\\w$])`,
    "g"
  )

  return expression
    .replace(globalVariablePattern, `$vars.${trimmedNewName}`)
    .replace(nodeVariablePattern, `${buildNodeReference(context.sourceNodeLabel)}.item.json.${trimmedNewName}`)
}

export function refactorNodeReferencesInExpression(
  expression: string,
  context: NodeLabelRenameContext
): string {
  const trimmedOldLabel = context.oldLabel.trim()
  const trimmedNewLabel = context.newLabel.trim()
  if (!trimmedOldLabel || trimmedOldLabel === trimmedNewLabel) {
    return expression
  }

  const escapedOldReference = escapeRegExp(buildNodeReference(trimmedOldLabel))
  const nodeReferencePattern = new RegExp(escapedOldReference, "g")

  return expression.replace(nodeReferencePattern, buildNodeReference(trimmedNewLabel))
}

function getExpressionConfigKeys(kind: NodeKind): string[] {
  const definition = getNodeDefinition(kind)
  const fieldKeys = definition.fields
    .filter((field) => field.ui === "expression" && (field.type === "text" || field.type === "textarea"))
    .map((field) => field.key)

  if (kind === "setVariable") {
    return [...fieldKeys, "valueExpression"]
  }

  return fieldKeys
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
