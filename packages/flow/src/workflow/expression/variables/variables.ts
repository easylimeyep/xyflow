import { getNodeDefinition } from "../../node-registry/node-ui-metadata"
import { getBuiltinExpressionVariables } from "../builtins/builtins"
import { isValidJsIdentifier } from "../variable-name/variable-name"
import type { ExpressionVariableOption, WorkflowEdge, WorkflowNode } from "../../types/types"

export function buildExpressionVariableCatalog(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  selectedNodeId: string | null
): ExpressionVariableOption[] {
  const options: ExpressionVariableOption[] = getBuiltinExpressionVariables()

  if (!selectedNodeId) {
    return options
  }

  const upstreamNodes = getReachableUpstreamNodes(nodes, edges, selectedNodeId)
  upstreamNodes.forEach((node) => {
    const nodeReference = buildNodeReference(node.id)
    const definition = getNodeDefinition(node.data.kind)
    const group = `Upstream: ${node.data.label}`
    options.push({
      group,
      label: `${nodeReference}.item.json`,
      value: `${nodeReference}.item.json`,
      description: `${definition.title} node output item.`,
    })

    definition.outputPaths.forEach((path) => {
      options.push({
        group,
        label: `${nodeReference}.item.json.${path}`,
        value: `${nodeReference}.item.json.${path}`,
        description: `${definition.title} output field.`,
      })
    })

    if (node.data.kind !== "setVariable") {
      return
    }

    const variableName = getSetVariableName(node)
    if (!variableName) {
      return
    }

    options.push({
      group,
      label: `${nodeReference}.item.json.${variableName}`,
      value: `${nodeReference}.item.json.${variableName}`,
      description: "Variable value from this Set Variable node.",
    })
    options.push({
      group: "Workflow variables",
      label: `$vars.${variableName}`,
      value: `$vars.${variableName}`,
      description: `Variable from node "${node.data.label}".`,
    })
  })

  return dedupeVariableOptions(options)
}

function getSetVariableName(node: WorkflowNode): string | null {
  if (node.data.kind !== "setVariable") {
    return null
  }

  const variableNameValue = node.data.config.variableName
  if (typeof variableNameValue !== "string") {
    return null
  }

  const variableName = variableNameValue.trim()
  if (!variableName || !isValidJsIdentifier(variableName)) {
    return null
  }

  return variableName
}

export function buildNodeReference(nodeId: string): string {
  return `$node("${escapeNodeId(nodeId)}")`
}

function escapeNodeId(nodeId: string): string {
  return nodeId.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}

function dedupeVariableOptions(options: ExpressionVariableOption[]): ExpressionVariableOption[] {
  const seenValues = new Set<string>()
  return options.filter((option) => {
    if (seenValues.has(option.value)) {
      return false
    }
    seenValues.add(option.value)
    return true
  })
}

function getReachableUpstreamNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  selectedNodeId: string
): WorkflowNode[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const incomingByTarget = new Map<string, string[]>()

  edges.forEach((edge) => {
    const entries = incomingByTarget.get(edge.target) ?? []
    entries.push(edge.source)
    incomingByTarget.set(edge.target, entries)
  })

  const visited = new Set<string>()
  const queue: string[] = [selectedNodeId]

  while (queue.length > 0) {
    const currentNodeId = queue.shift()
    if (!currentNodeId) {
      continue
    }

    const parents = incomingByTarget.get(currentNodeId) ?? []
    parents.forEach((parentId) => {
      if (visited.has(parentId)) {
        return
      }

      visited.add(parentId)
      queue.push(parentId)
    })
  }

  return Array.from(visited)
    .map((nodeId) => nodesById.get(nodeId))
    .filter((node): node is WorkflowNode => node !== undefined)
    .sort((left, right) => left.data.label.localeCompare(right.data.label))
}
