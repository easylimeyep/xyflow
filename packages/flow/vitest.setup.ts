import {
  builtinDefinitions,
  registerNodeDefinitions,
} from "./src/workflow/node-registry/registry"

// The node registry ships empty — a product registers the kinds it can run.
// This package's own suites are that product: they exercise the five built-in
// kinds, so register them once per test file, before any suite imports a module
// that builds a node at module scope.
registerNodeDefinitions(builtinDefinitions)

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
