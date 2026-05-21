import { getNodeDefinition } from "../node-registry/registry"
import type { NodeKind } from "../node-registry/registry"
import type { WorkflowEdge, WorkflowNode } from "../types/types"
import { refactorPlainVariableReferencesInGraph } from "../expression/refactor/refactor"
import { isValidJsIdentifier } from "../expression/variable-name/variable-name"

import type { NodeConfigUpdate } from "../store/types"

interface ConfigHookContext {
  targetNode: WorkflowNode
  update: NodeConfigUpdate
  previousValue: unknown
}

interface ConfigHookResult {
  nextNodes: WorkflowNode[]
  nextEdges: WorkflowEdge[]
}

export function runNodeConfigHooks(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  context: ConfigHookContext
): ConfigHookResult {
  let nextNodes = nodes
  let nextEdges = edges

  nextNodes = maybeRefactorExpressions(nextNodes, context)
  nextEdges = maybePruneIncomingEdges(nextEdges, context)

  return { nextNodes, nextEdges }
}

function maybeRefactorExpressions(
  nodes: WorkflowNode[],
  context: ConfigHookContext
): WorkflowNode[] {
  const definition = getNodeDefinition(context.targetNode.data.kind as NodeKind)
  const oldName = typeof context.previousValue === "string" ? context.previousValue : null
  const newName = typeof context.update.value === "string" ? context.update.value : null
  const isRenameFieldUpdate =
    definition.renameConfigKey === context.update.key &&
    oldName !== null &&
    newName !== null &&
    isValidJsIdentifier(oldName.trim()) &&
    isValidJsIdentifier(newName.trim())

  return isRenameFieldUpdate
    ? refactorPlainVariableReferencesInGraph(nodes, oldName, newName)
    : nodes
}

function maybePruneIncomingEdges(
  edges: WorkflowEdge[],
  context: ConfigHookContext
): WorkflowEdge[] {
  const shouldPruneIncomingEdges =
    context.targetNode.data.kind === "inlineExpression" &&
    context.update.key === "isRoot" &&
    context.previousValue !== true &&
    context.update.value === true

  return shouldPruneIncomingEdges
    ? edges.filter((edge) => edge.target !== context.targetNode.id)
    : edges
}
