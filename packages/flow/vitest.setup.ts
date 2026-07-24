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
