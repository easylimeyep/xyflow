import { workflowNodeRegistry } from "../node-registry"
import { getBuiltinExpressionVariables } from "./builtins"
import type { ExpressionVariableOption, WorkflowEdge, WorkflowNode } from "../types"

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
    const definition = workflowNodeRegistry[node.data.kind]
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
  })

  return dedupeVariableOptions(options)
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
