import type { ExpressionVariableOption, WorkflowEdge, WorkflowNode } from "../../types/types"
import { isValidJsIdentifier } from "../variable-name/variable-name"

const VARIABLE_NODE_KINDS = new Set(["extractor", "setVariable"])

export function collectWorkflowVariables(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  selectedNodeId: string | null
): ExpressionVariableOption[] {
  if (!selectedNodeId) {
    return []
  }

  const upstreamNodes = getReachableUpstreamNodes(nodes, edges, selectedNodeId)
  const options: ExpressionVariableOption[] = []

  upstreamNodes.forEach((node) => {
    if (!VARIABLE_NODE_KINDS.has(node.data.kind)) {
      return
    }

    const variableName =
      node.data.kind === "setVariable"
        ? readSetVariableName(node)
        : readExtractorVariableName(node)
    if (!variableName) {
      return
    }

    options.push({
      group: "Variables",
      label: variableName,
      value: variableName,
      description: `Variable from "${node.data.label}" node.`,
    })
  })

  return options
}

function readSetVariableName(node: WorkflowNode): string {
  const fromConfig = node.data.config.variableName
  if (typeof fromConfig === "string") {
    const trimmedConfig = fromConfig.trim()
    if (trimmedConfig.length > 0 && isValidJsIdentifier(trimmedConfig)) {
      return trimmedConfig
    }
  }
  return node.data.label.trim()
}

function readExtractorVariableName(node: WorkflowNode): string {
  const fromConfig = node.data.config.extractExpression
  if (typeof fromConfig === "string") {
    const trimmedConfig = fromConfig.trim()
    if (trimmedConfig.length > 0 && isValidJsIdentifier(trimmedConfig)) {
      return trimmedConfig
    }
  }
  return node.data.label.trim()
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
