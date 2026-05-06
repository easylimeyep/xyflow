import { describe, expect, it } from "vitest"

import type { ExpressionVariableOption } from "../types"
import { buildTemplateHighlightRanges } from "./highlighting"

const variables: ExpressionVariableOption[] = [
  {
    value: "myVar",
    label: "myVar",
    description: "Known variable",
    group: "Variables",
  },
]

describe("template expression highlighting", () => {
  it("marks delimiters as muted and known variable body as accent", () => {
    const ranges = buildTemplateHighlightRanges("before {{ myVar }} after", variables)

    expect(ranges).toEqual([
      { from: 7, to: 9, kind: "delimiter" },
      { from: 10, to: 15, kind: "known-variable" },
      { from: 16, to: 18, kind: "delimiter" },
    ])
  })

  it("does not accent unknown variable bodies", () => {
    const ranges = buildTemplateHighlightRanges("{{ typoVar }}", variables)

    expect(ranges).toEqual([
      { from: 0, to: 2, kind: "delimiter" },
      { from: 11, to: 13, kind: "delimiter" },
    ])
  })

  it("keeps whitespace outside the accent body range", () => {
    const ranges = buildTemplateHighlightRanges("{{   myVar   }}", variables)

    expect(ranges).toEqual([
      { from: 0, to: 2, kind: "delimiter" },
      { from: 5, to: 10, kind: "known-variable" },
      { from: 13, to: 15, kind: "delimiter" },
    ])
  })
})
