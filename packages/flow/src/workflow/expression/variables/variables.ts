import type {
  ExpressionVariableOption,
  WorkflowEdge,
  WorkflowNode,
} from "../../types/types"
import type { NodeRegistry } from "../../node-registry/registry"
import type {
  VariableScopeEdge,
  VariableScopeNode,
  VariableScopeResolver,
} from "./variable-scope"

/**
 * What a node may reference, and under what tag.
 *
 * `options` feeds autocomplete; `types` maps a variable name to the opaque tag
 * its producer reported. They are built together, from one walk, because they
 * are two views of the same answer — computing them apart is how they drift.
 */
export interface WorkflowVariableCatalog {
  options: ExpressionVariableOption[]
  types: Record<string, string>
}

interface VariableSources {
  type?: string
  labels: string[]
}

/**
 * A catalog builder bound to one graph.
 *
 * The scope projection and the id index depend on the graph, not on the node
 * being asked about, so building them once and reusing them across every node
 * turns a per-node O(n + e) setup into a single one. The store rebuilds the
 * whole cache on any structural change — every committed config edit, on every
 * node — so that loop is worth keeping cheap.
 */
export function createWorkflowVariableCatalogBuilder(
  registry: NodeRegistry,
  scope: VariableScopeResolver,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): (selectedNodeId: string | null) => WorkflowVariableCatalog {
  const scopeNodes = nodes.map(toScopeNode)
  const scopeEdges = edges.map(toScopeEdge)
  const nodesById = new Map(nodes.map((node) => [node.id, node]))

  // Frozen because one projection is now handed to the resolver on every node
  // of a rebuild, and the resolver is host code. `readonly` on
  // `VariableScopeInput` is erased at runtime, so a resolver written as "sort,
  // then take the nearest k" would reorder the array in place and change the
  // graph every later node in the same rebuild sees. That corruption would
  // track the iteration order of `graph.nodes`, which the structural signature
  // does not cover — it sorts a copy by id — so a rebuild would not clear it.
  // Freezing statement-by-statement keeps the types mutable and needs no casts.
  Object.freeze(scopeNodes)
  Object.freeze(scopeEdges)
  scopeNodes.forEach(Object.freeze)
  scopeEdges.forEach(Object.freeze)

  return (selectedNodeId) =>
    buildCatalog(registry, scope, {
      scopeNodes,
      scopeEdges,
      nodesById,
      selectedNodeId,
    })
}

export function collectWorkflowVariables(
  registry: NodeRegistry,
  scope: VariableScopeResolver,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  selectedNodeId: string | null
): WorkflowVariableCatalog {
  return createWorkflowVariableCatalogBuilder(
    registry,
    scope,
    nodes,
    edges
  )(selectedNodeId)
}

interface CatalogRequest {
  scopeNodes: VariableScopeNode[]
  scopeEdges: VariableScopeEdge[]
  nodesById: Map<string, WorkflowNode>
  selectedNodeId: string | null
}

function buildCatalog(
  registry: NodeRegistry,
  scope: VariableScopeResolver,
  request: CatalogRequest
): WorkflowVariableCatalog {
  const { selectedNodeId } = request
  if (!selectedNodeId) {
    // A fresh literal rather than a shared constant: the result is handed to
    // callers who may treat it as their own, and one `options.push` into a
    // shared empty catalog would leak into every later call.
    return { options: [], types: {} }
  }

  const producers = resolveScopedNodes(scope, request, selectedNodeId)
  const sourcesByName = new Map<string, VariableSources>()

  producers.forEach((node) => {
    const variable = registry.get(node.data.kind)?.variable?.({
      id: node.id,
      label: node.data.label,
      config: node.data.config,
    })

    const name = variable?.name.trim()
    if (!name) {
      return
    }

    // One definition of "reported a tag", applied here and nowhere else. A
    // blank tag counts as no tag: were the claim and the emit below to test it
    // differently, a blank could take the slot and then be discarded, burying
    // the real tag of a later source.
    const reportedType = variable?.type?.trim() ? variable.type : undefined

    const existing = sourcesByName.get(name)
    if (existing) {
      existing.labels.push(node.data.label)
      // The first producer to REPORT a tag owns it, which is not the same as
      // the first producer. An evaluator names its result without typing it,
      // so letting it reserve the slot would leave the name untyped — and an
      // untyped name reads downstream as a reference to nothing.
      existing.type ??= reportedType
      return
    }

    // Ties among producers that do report a tag go to label order: two nodes
    // writing one name disagree about more than typing, and picking a stable
    // winner keeps the catalog steady while the description makes the clash
    // visible.
    sourcesByName.set(name, { type: reportedType, labels: [node.data.label] })
  })

  const options: ExpressionVariableOption[] = []
  const types: Record<string, string> = {}

  sourcesByName.forEach((sources, name) => {
    options.push({
      group: "Variables",
      label: name,
      value: name,
      description: describeSources(sources.labels),
    })

    // `undefined` is the only "no tag" here, because the read above already
    // collapsed a blank one into it.
    if (sources.type !== undefined) {
      types[name] = sources.type
    }
  })

  return { options, types }
}

function describeSources(labels: string[]): string {
  if (labels.length === 1) {
    return `Variable from "${labels[0]}" node.`
  }

  return `Variable from ${labels.map((label) => `"${label}"`).join(", ")}.`
}

/**
 * The nodes the resolver picked, resolved and ordered.
 *
 * Two invariants live here rather than in the resolvers: unknown ids are
 * dropped, and the selected node is dropped whatever the resolver said. A
 * node referencing its own variable is a cycle, and an invariant a resolver
 * can opt out of is not an invariant.
 */
function resolveScopedNodes(
  scope: VariableScopeResolver,
  request: CatalogRequest,
  selectedNodeId: string
): WorkflowNode[] {
  const { scopeNodes, scopeEdges, nodesById } = request
  const scopedIds = scope({
    nodes: scopeNodes,
    edges: scopeEdges,
    nodeId: selectedNodeId,
  })

  const seen = new Set<string>()
  const resolved: WorkflowNode[] = []

  scopedIds.forEach((nodeId) => {
    if (nodeId === selectedNodeId || seen.has(nodeId)) {
      return
    }

    const node = nodesById.get(nodeId)
    if (!node) {
      return
    }

    seen.add(nodeId)
    resolved.push(node)
  })

  // Label order decides which producer owns a duplicated name's tag, so the
  // comparison must be total: equal labels would otherwise leave the winner to
  // the resolver's traversal order, which differs between scopes and between
  // an authored graph and an imported one. `deduplicateNodeLabels` makes a tie
  // rare, not impossible.
  return resolved.sort((left, right) => {
    const byLabel = left.data.label.localeCompare(right.data.label)
    return byLabel !== 0 ? byLabel : left.id.localeCompare(right.id)
  })
}

function toScopeNode(node: WorkflowNode): VariableScopeNode {
  return {
    id: node.id,
    kind: node.data.kind,
    label: node.data.label,
    config: node.data.config,
  }
}

function toScopeEdge(edge: WorkflowEdge): VariableScopeEdge {
  return { source: edge.source, target: edge.target }
}
