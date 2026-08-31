import type { NodeDefinition } from "./define-node"

/**
 * The node vocabulary of an editor instance.
 *
 * The vocabulary starts EMPTY. Every kind an editor offers — in the palette,
 * the config panel, the node factory, config normalization and on the canvas —
 * gets there through {@link registerNodeDefinitions}, and a product registers
 * exactly the kinds its backend can execute. Nothing is opt-out.
 *
 * This module is the registry ENGINE only — it holds no node definitions of
 * its own. The five the package ships (`builtinDefinitions`) live in
 * `./builtin-definitions`, a separate module, deliberately: those five carry
 * real component renderers, and everything in this file — mappers,
 * validation, layout, the store slices, this package's own test setup — needs
 * the engine (`registerNodeDefinitions`, `getNodeDefinition`, ...) without
 * needing a live component tree to come with it. See the comment on
 * `builtinDefinitions` for why that split matters.
 *
 * Registration is a module-level store rather than a React context because the
 * non-React layers — mappers, validation, layout, the store slices — resolve
 * definitions too, and they have no way to read a context. Consumers register
 * once, at module scope, before mounting the editor; `subscribeNodeDefinitions`
 * exists so a canvas that mounted first still re-renders when they do.
 */

/**
 * A node kind is any string.
 *
 * It used to be the closed union of the five built-ins, which made a consumer
 * vocabulary impossible to express: every store command, mapper and validation
 * signature rejected an unknown kind at the type level. Kind validity is now a
 * runtime question — {@link isNodeKind} answers it against the live registry.
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

  const byKind = new Map(ordered.map((definition) => [definition.kind, definition]))

  return {
    list: () => ordered,
    get: (kind) => byKind.get(kind),
    has: (kind) => byKind.has(kind),
    kinds: () => ordered.map((definition) => definition.kind),
  }
}

export const EMPTY_NODE_REGISTRY: NodeRegistry = createNodeRegistry([])

const EMPTY_DEFINITIONS: readonly NodeDefinition[] = []

let definitions: readonly NodeDefinition[] = EMPTY_DEFINITIONS
let registry: ReadonlyMap<string, NodeDefinition> = indexBy(EMPTY_DEFINITIONS)

const listeners = new Set<() => void>()

function indexBy(
  entries: readonly NodeDefinition[]
): ReadonlyMap<string, NodeDefinition> {
  return new Map(entries.map((definition) => [definition.kind, definition]))
}

/** Swap the vocabulary for a new one and wake every subscriber. */
function publish(next: readonly NodeDefinition[]): void {
  definitions = next
  registry = indexBy(next)
  listeners.forEach((listener) => listener())
}

/**
 * Add consumer node kinds to the vocabulary.
 *
 * A definition whose kind is already registered REPLACES the previous one in
 * place, so registering twice (React strict mode, a hot reload) is idempotent
 * and never duplicates a palette entry. New kinds are appended, which is the
 * order the palette renders in.
 */
export function registerNodeDefinitions(
  incoming: readonly NodeDefinition[]
): void {
  if (incoming.length === 0) {
    return
  }
  const replacements = indexBy(incoming)
  const updated = definitions.map(
    (definition) => replacements.get(definition.kind) ?? definition
  )
  const known = new Set(definitions.map((definition) => definition.kind))
  const appended = incoming.filter(
    (definition) => !known.has(definition.kind) && definition.kind.length > 0
  )
  publish([...updated, ...appended])
}

/**
 * Empty the vocabulary, back to the state a freshly imported package is in.
 *
 * Exists for tests, which would otherwise leak a vocabulary from one suite into
 * the next. It does NOT restore the built-ins — nothing is registered by
 * default, so a suite that needs them re-registers `builtinDefinitions` itself.
 */
export function resetNodeDefinitions(): void {
  publish(EMPTY_DEFINITIONS)
}

/** The live vocabulary, in palette order. */
export function listNodeDefinitions(): readonly NodeDefinition[] {
  return definitions
}

/** The definition for a kind, or `undefined` when nothing is registered. */
export function getNodeDefinition(kind: NodeKind): NodeDefinition | undefined {
  return registry.get(kind)
}

/** The kinds currently registered, in palette order. */
export function workflowNodeKinds(): NodeKind[] {
  return definitions.map((definition) => definition.kind)
}

/** True when a value names a currently registered kind. */
export function isNodeKind(value: unknown): value is NodeKind {
  return typeof value === "string" && registry.has(value)
}

/**
 * Subscribe to vocabulary changes. Returns the unsubscribe function, which is
 * the shape `useSyncExternalStore` expects.
 */
export function subscribeNodeDefinitions(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
