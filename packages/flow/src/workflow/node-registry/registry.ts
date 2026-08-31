import type { NodeDefinition } from "./define-node"

/**
 * The node vocabulary of an editor instance.
 *
 * A vocabulary starts EMPTY. Every kind an editor offers — in the palette, the
 * config panel, the node factory, config normalization and on the canvas — gets
 * there because the host handed that editor a definition array, and a product
 * hands over exactly the kinds its backend can execute. Nothing is opt-out.
 *
 * A vocabulary is per editor instance, not per module: `<WorkflowEditor
 * definitions={...} />` builds one {@link NodeRegistry} into that editor's
 * store, and every layer that resolves a kind — mappers, validation, layout,
 * the store slices, the React components — is handed that registry rather than
 * reaching for a global. Two editors on one page can therefore disagree about
 * what exists without fighting over a shared mutable store.
 *
 * This module is the registry ENGINE only — it holds no node definitions of
 * its own. The five the package ships (`builtinDefinitions`) live in
 * `./builtin-definitions`, a separate module, deliberately: those five carry
 * real component renderers, and everything that only needs the engine should
 * not drag a live component tree in with it. See the comment on
 * `builtinDefinitions` for why that split matters.
 */

/**
 * A node kind is any string.
 *
 * It used to be the closed union of the five built-ins, which made a consumer
 * vocabulary impossible to express: every store command, mapper and validation
 * signature rejected an unknown kind at the type level. Kind validity is now a
 * runtime question, answered by the registry an editor was given —
 * {@link NodeRegistry.has}.
 */
export type NodeKind = string

export interface NodeRegistry {
  /** The vocabulary, in palette order. */
  list(): readonly NodeDefinition[]
  /** The definition for a kind, or `undefined` when it is not in this registry. */
  get(kind: NodeKind): NodeDefinition | undefined
  /** True when the kind belongs to this registry. */
  has(kind: NodeKind): boolean
  /** The kinds in this registry, in palette order. */
  kinds(): NodeKind[]
}

/**
 * Build a vocabulary from a definition array.
 *
 * A later definition of a kind REPLACES an earlier one in place, so a host
 * composing two arrays (a base set plus an override) gets the override without
 * a duplicate palette entry, and the order stays the order it declared. A
 * definition with an empty kind is dropped: it could never be looked up.
 */
export function createNodeRegistry(
  definitions: readonly NodeDefinition[]
): NodeRegistry {
  const ordered: NodeDefinition[] = []
  const index = new Map<string, number>()

  definitions.forEach((definition) => {
    if (definition.kind.length === 0) {
      return
    }
    const existing = index.get(definition.kind)
    if (existing === undefined) {
      index.set(definition.kind, ordered.length)
      ordered.push(definition)
      return
    }
    ordered[existing] = definition
  })

  // Freeze the array once so list() returns a stable reference.
  // The identity is deliberately preserved because consumers use it as a
  // memo/selector dependency (e.g., zustand selectors), and a fresh array
  // on every call would break referential equality and cause re-render churn.
  Object.freeze(ordered)

  const byKind = new Map(
    ordered.map((definition) => [definition.kind, definition])
  )

  return {
    list: () => ordered,
    get: (kind) => byKind.get(kind),
    has: (kind) => byKind.has(kind),
    kinds: () => ordered.map((definition) => definition.kind),
  }
}

export const EMPTY_NODE_REGISTRY: NodeRegistry = createNodeRegistry([])
