import type { NodeDefinition } from "./define-node"
import { extractor } from "../nodes/data/extractor"
import { inlineExpression } from "../nodes/data/inline-expression"
import { setVariable } from "../nodes/data/set-variable"
import { evaluator } from "../nodes/logic/evaluator"
import { result } from "../nodes/logic/result"

/**
 * The node vocabulary of an editor instance.
 *
 * The five definitions below ship with the package. A consuming product adds
 * its own with {@link registerNodeDefinitions}: the palette, the config panel,
 * the node factory, config normalization and the canvas all read the live list,
 * so a registered kind behaves exactly like a built-in one — including the
 * generic renderer, which draws any definition from its `fields` without a
 * bespoke component.
 *
 * Registration is a module-level store rather than a React context because the
 * non-React layers — mappers, validation, layout, the store slices — resolve
 * definitions too, and they have no way to read a context. Consumers register
 * once, at module scope, before mounting the editor; `subscribeNodeDefinitions`
 * exists so a canvas that mounted first still re-renders when they do.
 */
const builtinDefinitions = [
  evaluator,
  setVariable,
  inlineExpression,
  extractor,
  result,
] as const

type BuiltinDefinitions = typeof builtinDefinitions
type ExtractKind<T> = T extends NodeDefinition<infer K> ? K : never

/** The kinds this package ships. Consumer kinds are not part of this union. */
export type BuiltinNodeKind = ExtractKind<BuiltinDefinitions[number]>

/**
 * A node kind is any string.
 *
 * It used to be the closed union of the five built-ins, which made a consumer
 * vocabulary impossible to express: every store command, mapper and validation
 * signature rejected an unknown kind at the type level. Kind validity is now a
 * runtime question — {@link isNodeKind} answers it against the live registry.
 */
export type NodeKind = string

let definitions: readonly NodeDefinition[] = builtinDefinitions
let registry: ReadonlyMap<string, NodeDefinition> = indexBy(builtinDefinitions)

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
 * Drop every consumer registration and return to the built-in five. Exists for
 * tests, which would otherwise leak a vocabulary from one suite into the next.
 */
export function resetNodeDefinitions(): void {
  publish(builtinDefinitions)
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

/**
 * Wake subscribers without changing the definition list. Client registries that
 * live outside this module — the view registry — call this so a view
 * registration reaches the canvas too.
 */
export function notifyNodeRegistryChanged(): void {
  listeners.forEach((listener) => listener())
}

export { builtinDefinitions }
