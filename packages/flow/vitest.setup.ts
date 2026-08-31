import { builtinBaseDefinitions } from "./src/workflow/node-registry/builtin-base-definitions"
import { registerNodeDefinitions } from "./src/workflow/node-registry/registry"

// The node registry ships empty — a product registers the kinds it can run.
// This package's own suites are that product: they exercise the five built-in
// kinds, so register them once per test file, before any suite imports a
// module that builds a node at module scope.
//
// Registered from `builtinBaseDefinitions`, which imports each kind's
// `./definition` (the base object, no renderer)
// rather than from `registry.ts`'s own `builtinDefinitions` (the same five,
// with `NodeDefinition.view` attached via each node's `index.ts`):
// `builtinDefinitions` statically imports all five components, and no suite
// in this package needs a REGISTERED definition to carry a `view` — every
// suite that unit-tests a component imports it directly from `./component`,
// and `buildNodeTypes`/`view` themselves are exercised with locally defined
// fixtures (see `node-types-builder.test.tsx`). Registering the components'
// own module here, before a test file's own `vi.mock` calls exist, would
// mean `vi.mock` misses that first, real load — see the comment on
// `builtinDefinitions` in `./src/workflow/node-registry/builtin-definitions.ts`.
registerNodeDefinitions(builtinBaseDefinitions)

// jsdom polyfills required by react-aria-components overlays/collections.

// react-aria's selectable collection builds selectors via CSS.escape, which
// jsdom does not implement.
const cssEscape = (value: string): string =>
  String(value).replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`)

const cssShim = (globalThis.CSS ?? {}) as typeof globalThis.CSS
if (typeof cssShim.escape !== "function") {
  cssShim.escape = cssEscape
}
globalThis.CSS = cssShim

// jsdom does not implement scrollIntoView, which react-aria calls when focusing
// listbox items.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
