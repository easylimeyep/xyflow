import type { NodeDefinition } from "./define-node"
import { extractor } from "../nodes/data/extractor"
import { inlineExpression } from "../nodes/data/inline-expression"
import { setVariable } from "../nodes/data/set-variable"
import { evaluator } from "../nodes/logic/evaluator"
import { result } from "../nodes/logic/result"

/**
 * The node vocabulary of an editor instance.
 *
 * The vocabulary starts EMPTY. Every kind an editor offers — in the palette,
 * the config panel, the node factory, config normalization and on the canvas —
 * gets there through {@link registerNodeDefinitions}, and a product registers
 * exactly the kinds its backend can execute. Nothing is opt-out.
 *
 * The five definitions below still ship with the package, and a consumer that
 * wants them asks for them by name:
 *
 * ```ts
 * registerNodeDefinitions(builtinDefinitions)          // all five
 * registerNodeDefinitions([evaluator, result])         // or a subset
 * ```
 *
 * They used to be registered here, which made them the default vocabulary of
 * every editor instance: a product with its own kinds got the package's five in
 * its palette too, offering an author nodes its engine would refuse to run. The
 * definitions are unchanged — only their registration moved to the consumer.
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

export { builtinDefinitions }
