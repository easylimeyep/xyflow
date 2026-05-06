import { describe, expect, it } from "vitest"

import { readFileSync } from "node:fs"

describe("expression editor stylesheet", () => {
  const stylesheet = readFileSync("src/style.css", "utf8")

  it("keeps the CodeMirror editor from drawing a second control border", () => {
    const codeMirrorEditorRule = stylesheet.match(/\.cm-editor\s*\{[^}]*\}/)?.[0]

    expect(codeMirrorEditorRule).toBeDefined()
    expect(codeMirrorEditorRule).not.toMatch(/\bborder\s*:/)
  })

  it("keeps floating autocomplete tooltip border styling separate", () => {
    const autocompleteTooltipRule = stylesheet.match(
      /\.cm-tooltip\.cm-shadcn-autocomplete\s*\{[^}]*\}/
    )?.[0]

    expect(autocompleteTooltipRule).toMatch(/\bborder\s*:/)
  })
})
