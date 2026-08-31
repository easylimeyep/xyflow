import type { NodeKind, NodeRegistry } from "./registry"

/**
 * Connection rules for a kind. An unregistered kind connects to nothing rather
 * than throwing: a graph can legitimately carry a kind whose definition the
 * consumer has not registered (an older document, a feature flag), and the
 * canvas must still render it.
 */
export function getAllowedTargets(
  registry: NodeRegistry,
  kind: NodeKind
): string[] {
  return registry.get(kind)?.allowedTargets ?? []
}

export function getNodeOutputPaths(
  registry: NodeRegistry,
  kind: NodeKind
): string[] {
  return registry.get(kind)?.outputPaths ?? []
}
