// jsdom does not implement `CSS.escape`, which react-aria-components relies on
// inside selectable collections (Menu/ListBox). Provide a spec-compatible
// polyfill so aria-based components (e.g. the Command menu) render under test.
if (typeof globalThis.CSS === "undefined") {
  // @ts-expect-error minimal CSS namespace for jsdom
  globalThis.CSS = {}
}

if (typeof globalThis.CSS.escape !== "function") {
  globalThis.CSS.escape = (value: string): string => {
    const string = String(value)
    let result = ""
    for (let i = 0; i < string.length; i++) {
      const char = string.charAt(i)
      const codeUnit = string.charCodeAt(i)
      if (codeUnit === 0x0000) {
        result += "�"
      } else if (
        (codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
        codeUnit === 0x007f ||
        (i === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (i === 1 &&
          codeUnit >= 0x0030 &&
          codeUnit <= 0x0039 &&
          string.charCodeAt(0) === 0x002d)
      ) {
        result += `\\${codeUnit.toString(16)} `
      } else if (
        codeUnit >= 0x0080 ||
        char === "-" ||
        char === "_" ||
        (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
        (codeUnit >= 0x0061 && codeUnit <= 0x007a)
      ) {
        result += char
      } else {
        result += `\\${char}`
      }
    }
    return result
  }
}
