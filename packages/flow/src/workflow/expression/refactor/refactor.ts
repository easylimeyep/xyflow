import { workflowNodeRegistry } from "../../node-registry/node-registry"
import type { NodeKind, WorkflowNode } from "../../types/types"
import { buildNodeReference } from "../variables/variables"

interface VariableRenameContext {
  sourceNodeId: string
  oldName: string
  newName: string
}

export function refactorVariableReferencesInGraph(
  nodes: WorkflowNode[],
  context: VariableRenameContext
): WorkflowNode[] {
  return nodes.map((node) => {
    const expressionKeys = getExpressionConfigKeys(node.data.kind)
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

      const nextValue = refactorVariableReferencesInExpression(value, context)
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
  const escapedNodeReference = escapeRegExp(buildNodeReference(context.sourceNodeId))

  const globalVariablePattern = new RegExp(`\\$vars\\.${escapedOldName}(?![\\w$])`, "g")
  const nodeVariablePattern = new RegExp(
    `${escapedNodeReference}\\.item\\.json\\.${escapedOldName}(?![\\w$])`,
    "g"
  )

  return expression
    .replace(globalVariablePattern, `$vars.${trimmedNewName}`)
    .replace(nodeVariablePattern, `${buildNodeReference(context.sourceNodeId)}.item.json.${trimmedNewName}`)
}

function getExpressionConfigKeys(kind: NodeKind): string[] {
  const definition = workflowNodeRegistry[kind]
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
