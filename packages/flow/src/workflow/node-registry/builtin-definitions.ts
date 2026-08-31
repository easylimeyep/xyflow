import type { NodeDefinition } from "./define-node"
import { extractor } from "../nodes/data/extractor"
import { inlineExpression } from "../nodes/data/inline-expression"
import { setVariable } from "../nodes/data/set-variable"
import { evaluator } from "../nodes/logic/evaluator"
import { result } from "../nodes/logic/result"

/**
 * The five definitions that ship with the package, each carrying its bespoke
 * renderer (see `NodeDefinition.view`) since they're imported here from each
 * node's `index.ts` rather than its `definition.ts`.
 *
 * A consumer asks for them by name:
 *
 * ```ts
 * registerNodeDefinitions(builtinDefinitions)          // all five
 * registerNodeDefinitions([evaluator, result])         // or a subset
 * ```
 *
 * Kept in a module separate from `registry.ts`: the registry engine
 * (`registerNodeDefinitions`, `getNodeDefinition`, ...) is imported by
 * everything that resolves a node kind — mappers, validation, layout, the
 * store slices, and this package's own `vitest.setup.ts` — and none of that
 * needs a live component tree. If this constant lived in `registry.ts`
 * itself, importing the engine would also import all five components (and
 * their real dependencies) as a side effect, which breaks a test file that
 * mocks one of those dependencies for its own unit test: `vi.mock` only
 * intercepts a module's FIRST load, and `vitest.setup.ts` would have already
 * forced that load, unmocked, before the test file's own `vi.mock` calls
 * exist.
 */
export const builtinDefinitions = [
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
