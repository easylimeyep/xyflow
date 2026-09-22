import type {
  ExpressionVariableOption,
  WorkflowGraphState,
  WorkflowNodeData,
} from "../types/types"
import { createWorkflowVariableCatalogBuilder } from "../expression/variables/variables"
import {
  upstreamScope,
  type VariableScopeResolver,
} from "../expression/variables/variable-scope"
import type { NodeRegistry } from "../node-registry/registry"
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

function normalizeConfigForSignature(
  nodeData: WorkflowNodeData
): Record<string, unknown> {
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

export function projectExpressionDeps(
  graph: WorkflowGraphState
): ExpressionDepsGraph {
  const nodes = graph.nodes
    .map(toExpressionDepsNode)
    .sort((left, right) => left.id.localeCompare(right.id))
  const edges = graph.edges.map(toExpressionDepsEdge).sort((left, right) => {
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
  const keys = Object.keys(record).sort((left, right) =>
    left.localeCompare(right)
  )
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(",")}}`
}

export function computeStructuralSignature(
  expressionDeps: ExpressionDepsGraph
): string {
  return stableSerialize(expressionDeps)
}

type ExpressionSliceKeys =
  | "expressionDeps"
  | "expressionStructuralVersion"
  | "expressionStructuralSignature"
  | "expressionCatalogCache"
  | "expressionVariableTypesCache"

export function buildExpressionSliceState(
  graph: WorkflowGraphState,
  registry: NodeRegistry,
  scope: VariableScopeResolver
): Pick<WorkflowStoreState, ExpressionSliceKeys> {
  const expressionDeps = projectExpressionDeps(graph)
  const expressionStructuralSignature =
    computeStructuralSignature(expressionDeps)
  return {
    expressionDeps,
    expressionStructuralVersion: 0,
    expressionStructuralSignature,
    ...buildExpressionCaches(registry, scope, graph),
  }
}

/**
 * The dependencies the caches need are already on `state` — every call site
 * passes it — so no slice has to thread the registry or the scope through.
 */
export function buildExpressionSlicePatch(
  state: WorkflowStoreState,
  graph: WorkflowGraphState
): Partial<Pick<WorkflowStoreState, ExpressionSliceKeys>> {
  const expressionDeps = projectExpressionDeps(graph)
  const expressionStructuralSignature =
    computeStructuralSignature(expressionDeps)
  if (state.expressionStructuralSignature === expressionStructuralSignature) {
    return {}
  }
  return {
    expressionDeps,
    expressionStructuralVersion: state.expressionStructuralVersion + 1,
    expressionStructuralSignature,
    ...buildExpressionCaches(
      state.registry,
      state.runtime.variables?.scope ?? upstreamScope,
      graph
    ),
  }
}

/**
 * Both catalogs, from one walk per node.
 *
 * They are built together because they are two views of one answer: computing
 * them apart is exactly how an option and its type tag drift out of step.
 */
function buildExpressionCaches(
  registry: NodeRegistry,
  scope: VariableScopeResolver,
  graph: WorkflowGraphState
): Pick<
  WorkflowStoreState,
  "expressionCatalogCache" | "expressionVariableTypesCache"
> {
  // `__global__` is the key a null nodeId maps onto: an expression edited
  // outside any node can reference nothing.
  const expressionCatalogCache = new Map<string, ExpressionVariableOption[]>([
    ["__global__", []],
  ])
  const expressionVariableTypesCache = new Map<string, Record<string, string>>([
    ["__global__", {}],
  ])

  const buildCatalog = createWorkflowVariableCatalogBuilder(
    registry,
    scope,
    graph.nodes,
    graph.edges
  )

  graph.nodes.forEach((node) => {
    const catalog = buildCatalog(node.id)
    expressionCatalogCache.set(node.id, catalog.options)
    expressionVariableTypesCache.set(node.id, catalog.types)
  })

  return { expressionCatalogCache, expressionVariableTypesCache }
}
