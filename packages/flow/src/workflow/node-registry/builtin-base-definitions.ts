import { extractor } from "../nodes/data/extractor/definition"
import { inlineExpression } from "../nodes/data/inline-expression/definition"
import { pathExtractor } from "../nodes/data/path-extractor/definition"
import { setVariable } from "../nodes/data/set-variable/definition"
import { evaluator } from "../nodes/logic/evaluator/definition"
import { result } from "../nodes/logic/result/definition"

/**
 * The built-in definitions WITHOUT their renderers.
 *
 * The same kinds as `builtinDefinitions`, imported from each node's
 * `./definition` module rather than its `index.ts`, so this module pulls in no
 * React component tree. That is what makes it safe for non-rendering callers —
 * this package's `vitest.setup.ts` and every `.ts` suite that needs a
 * vocabulary to build a registry from: importing the components here would
 * force their first, unmocked load before a test file's own hoisted `vi.mock`
 * calls exist. See the comment on `builtinDefinitions` for the full story.
 *
 * A host that wants the built-ins with their canvas renderers wants
 * `builtinDefinitions`, not this.
 */
export const builtinBaseDefinitions = [
  evaluator,
  setVariable,
  inlineExpression,
  extractor,
  pathExtractor,
  result,
] as const
