import type { WorkflowGraphState, WorkflowNodeData } from "../types/types"
import type {
  ExpressionDepsEdge,
  ExpressionDepsGraph,
  ExpressionDepsNode,
  WorkflowStoreState,
} from "./types"

function toExpressionDepsNode(
  node: WorkflowGraphState["nodes"][number]
): ExpressionDepsNode {
  return {
    id: node.id,
    kind: node.data.kind,
    label: node.data.label,
    config: normalizeConfigForSignature(node.data),
  }
}

function normalizeConfigForSignature(nodeData: WorkflowNodeData): Record<string, unknown> {
  const config = nodeData.config
  return { ...config }
}

function toExpressionDepsEdge(
  edge: WorkflowGraphState["edges"][number]
): ExpressionDepsEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
  }
}

export function projectExpressionDeps(graph: WorkflowGraphState): ExpressionDepsGraph {
  const nodes = graph.nodes
    .map(toExpressionDepsNode)
    .sort((left, right) => left.id.localeCompare(right.id))
  const edges = graph.edges
    .map(toExpressionDepsEdge)
    .sort((left, right) => {
      const byId = left.id.localeCompare(right.id)
      if (byId !== 0) return byId
      const bySource = left.source.localeCompare(right.source)
      if (bySource !== 0) return bySource
      return left.target.localeCompare(right.target)
    })

  return { nodes, edges }
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`
  }
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort((left, right) => left.localeCompare(right))
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(",")}}`
}

export function computeStructuralSignature(expressionDeps: ExpressionDepsGraph): string {
  return stableSerialize(expressionDeps)
}

export function buildExpressionSliceState(graph: WorkflowGraphState): Pick<
  WorkflowStoreState,
  "expressionDeps" | "expressionStructuralSignature"
> {
  const expressionDeps = projectExpressionDeps(graph)
  const expressionStructuralSignature = computeStructuralSignature(expressionDeps)
  return {
    expressionDeps,
    expressionStructuralSignature,
  }
}

export function buildExpressionSlicePatch(
  state: WorkflowStoreState,
  graph: WorkflowGraphState
): Partial<Pick<WorkflowStoreState, "expressionDeps" | "expressionStructuralSignature">> {
  const expressionDeps = projectExpressionDeps(graph)
  const expressionStructuralSignature = computeStructuralSignature(expressionDeps)
  if (state.expressionStructuralSignature === expressionStructuralSignature) {
    return {}
  }
  return {
    expressionDeps,
    expressionStructuralSignature,
  }
}
