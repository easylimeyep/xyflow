import { RangeSetBuilder } from "@codemirror/state"
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view"

import { parseTemplateSegments } from "../template"
import type { ExpressionVariableOption } from "../types"

export type TemplateHighlightKind = "delimiter" | "known-variable"

export interface TemplateHighlightRange {
  from: number
  to: number
  kind: TemplateHighlightKind
}

const delimiterDecoration = Decoration.mark({
  class: "cm-expression-delimiter",
})
const knownVariableDecoration = Decoration.mark({
  class: "cm-expression-known-variable",
})

export function buildTemplateHighlightRanges(
  template: string,
  variables: ExpressionVariableOption[]
): TemplateHighlightRange[] {
  const knownVariableValues = new Set(
    variables.map((variable) => variable.value.trim()).filter(Boolean)
  )
  const ranges: TemplateHighlightRange[] = []

  for (const segment of parseTemplateSegments(template)) {
    if (segment.type !== "expression") {
      continue
    }

    ranges.push({
      from: segment.start,
      to: segment.start + 2,
      kind: "delimiter",
    })

    if (segment.closed) {
      const closeStart = segment.end - 2
      const leadingWhitespace = segment.value.length - segment.value.trimStart().length
      const body = segment.value.trim()

      if (knownVariableValues.has(body)) {
        const bodyStart = segment.start + 2 + leadingWhitespace
        ranges.push({
          from: bodyStart,
          to: bodyStart + body.length,
          kind: "known-variable",
        })
      }

      ranges.push({
        from: closeStart,
        to: segment.end,
        kind: "delimiter",
      })
    }
  }

  return ranges
}

export function createTemplateHighlightExtension(
  variables: ExpressionVariableOption[]
) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        this.decorations = buildTemplateDecorations(view, variables)
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.decorations = buildTemplateDecorations(update.view, variables)
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    }
  )
}

function buildTemplateDecorations(
  view: EditorView,
  variables: ExpressionVariableOption[]
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const template = view.state.doc.toString()

  for (const range of buildTemplateHighlightRanges(template, variables)) {
    builder.add(
      range.from,
      range.to,
      range.kind === "delimiter" ? delimiterDecoration : knownVariableDecoration
    )
  }

  return builder.finish()
}
