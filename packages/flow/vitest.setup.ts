import { beforeAll } from "vitest"

// The node registry ships empty — a product registers the kinds it can run.
// This package's own suites are that product: they exercise the five built-in
// kinds, so register them once per test file, before any suite runs.
//
// The registry import is dynamic, deferred to `beforeAll`, rather than a
// static top-level import: a built-in definition now carries its renderer
// (`NodeDefinition.view`, wired in each node's `index.ts`), so importing the
// registry pulls in every built-in's component module. A static import here
// would do that during this setup file's own load — before a test file's
// `vi.mock` calls (hoisted to the top of that file) have registered, so a
// mock for a component's own dependency would silently miss and the real
// implementation would run instead. Deferring to `beforeAll` lets a test
// file's mocks win the race: its `vi.mock` calls resolve during that file's
// load, before this hook body ever executes.
beforeAll(async () => {
  const { builtinDefinitions, registerNodeDefinitions } = await import(
    "./src/workflow/node-registry/registry"
  )
  registerNodeDefinitions(builtinDefinitions)
  // A generous timeout: this is the first import of every built-in's
  // component module (CodeMirror, react-aria, etc. included) for the file,
  // which under a fully parallel test run can exceed the 10s hook default.
}, 30000)

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
