import { getNodeDefinition, type NodeKind } from "./registry"

/**
 * Connection rules for a kind. An unregistered kind connects to nothing rather
 * than throwing: a graph can legitimately carry a kind whose definition the
 * consumer has not registered (an older document, a feature flag), and the
 * canvas must still render it.
 */
export function getAllowedTargets(kind: NodeKind): string[] {
  return getNodeDefinition(kind)?.allowedTargets ?? []
}

export function getNodeOutputPaths(kind: NodeKind): string[] {
  return getNodeDefinition(kind)?.outputPaths ?? []
}
