/**
 * Who may see whose variables.
 *
 * This module is deliberately dependency-free: a scope is a question about a
 * graph's shape, not about node kinds, the registry or the store. Keeping it
 * that way is what lets a host write its own resolver without importing half
 * the package.
 */

export interface VariableScopeNode {
  id: string
  kind: string
  label: string
  /** Read-only: the live config off the store, passed without a copy. */
  config: Readonly<Record<string, unknown>>
}

export interface VariableScopeEdge {
  source: string
  target: string
}

export interface VariableScopeInput {
  nodes: readonly VariableScopeNode[]
  edges: readonly VariableScopeEdge[]
  /** The node the catalog is being built for. */
  nodeId: string
}

/**
 * Which nodes may contribute a variable to `nodeId`.
 *
 * Returns candidate node ids, in any order and without deduplication — the
 * catalog resolves them, drops the ones it does not recognise and sorts what
 * remains by source label. Sorting lives there rather than here so that every
 * resolver, including a host's, produces a consistently ordered catalog
 * without having to remember to.
 *
 * A resolver cannot grant a node sight of its own variable: the catalog drops
 * `nodeId` from whatever comes back, because a self-reference is a cycle.
 */
export type VariableScopeResolver = (
  input: VariableScopeInput
) => readonly string[]

/**
 * Everything that flows into the node, however far back.
 *
 * The package default, and the behaviour the editor has always had: variables
 * appear once the graph actually routes their producer into the node reading
 * them.
 */
export const upstreamScope: VariableScopeResolver = ({ edges, nodeId }) => {
  const incomingByTarget = new Map<string, string[]>()

  edges.forEach((edge) => {
    const entries = incomingByTarget.get(edge.target) ?? []
    entries.push(edge.source)
    incomingByTarget.set(edge.target, entries)
  })

  const visited = new Set<string>()
  const queue: string[] = [nodeId]

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
}

/**
 * Every node on the canvas, connected or not.
 *
 * For hosts whose backend resolves variables from a flat namespace rather than
 * by following the graph, so that wiring order stops governing what an author
 * may reference.
 */
export const graphScope: VariableScopeResolver = ({ nodes }) =>
  nodes.map((node) => node.id)
