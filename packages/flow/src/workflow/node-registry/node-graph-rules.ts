import { isBranchingKind } from "../types/branching"
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

/**
 * True when a branch handle of this kind may connect to more than one target.
 * Only a branching kind can answer `true` — the flag means nothing on a kind
 * without `true`/`false` handles. An unregistered kind answers `false`: one
 * target per branch is the rule a kind has to opt out of, never into.
 */
export function allowsMultipleBranchTargets(
  registry: NodeRegistry,
  kind: NodeKind
): boolean {
  return (
    isBranchingKind(kind) && registry.get(kind)?.multipleBranchTargets === true
  )
}
