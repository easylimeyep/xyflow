import { builtinDefinitions, registerNodeDefinitions } from "@flow/flow"

/**
 * Opt these stories into the package's own node kinds.
 *
 * The registry ships empty — a product registers the kinds its backend can run
 * — and these examples are about the built-in five. Registration lives in its
 * own module, rather than inline in `preview.tsx`, so that an example building
 * a graph at module scope can import it and be certain the vocabulary exists:
 * an import is evaluated before the body of the module that imports it, while
 * preview annotations only happen to load first.
 */
registerNodeDefinitions(builtinDefinitions)
