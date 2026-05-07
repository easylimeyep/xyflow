import { describe, expect, it } from "vitest"

import { readFileSync } from "node:fs"

describe("expression editor stylesheet", () => {
  const stylesheet = readFileSync("src/style.css", "utf8")

  it("keeps the CodeMirror editor from drawing a second control border", () => {
    const codeMirrorEditorRule = stylesheet.match(/\.cm-editor\s*\{[^}]*\}/)?.[0]

    expect(codeMirrorEditorRule).toBeDefined()
    expect(codeMirrorEditorRule).not.toMatch(/\bborder\s*:/)
  })

  it("keeps editable CodeMirror surfaces on a text cursor", () => {
    const editableSurfaceRule = stylesheet.match(
      /\.cm-editor,\s*\.cm-scroller,\s*\.cm-content\s*\{[^}]*\}/
    )?.[0]

    expect(editableSurfaceRule).toBeDefined()
    expect(editableSurfaceRule).toMatch(/\bcursor\s*:\s*text\s*;/)
  })

  it("keeps floating autocomplete tooltip border styling separate", () => {
    const autocompleteTooltipRule = stylesheet.match(
      /\.cm-tooltip\.cm-shadcn-autocomplete\s*\{[^}]*\}/
    )?.[0]

    expect(autocompleteTooltipRule).toMatch(/\bborder\s*:/)
  })

  it("styles expression delimiters as muted text", () => {
    const delimiterRule = stylesheet.match(
      /\.cm-expression-delimiter\s*\{[^}]*\}/
    )?.[0]

    expect(delimiterRule).toMatch(/var\(--flow-editor-muted\)/)
  })

  it("styles known expression variables with an accent", () => {
    const knownVariableRule = stylesheet.match(
      /\.cm-expression-known-variable\s*\{[^}]*\}/
    )?.[0]

    expect(knownVariableRule).toMatch(/var\(--primary\)/)
  })
})
