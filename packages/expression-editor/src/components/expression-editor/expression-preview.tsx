"use client"

import { useMemo, type PointerEvent, type ReactNode } from "react"

import {
  buildTemplateHighlightRanges,
  type TemplateHighlightKind,
} from "../../highlighting/highlighting"
import type { ExpressionVariableOption } from "../../types"

const HIGHLIGHT_CLASS_NAMES: Record<TemplateHighlightKind, string> = {
  delimiter: "cm-expression-delimiter",
  "known-variable": "cm-expression-known-variable",
}

export interface ExpressionPreviewPoint {
  x: number
  y: number
}

interface ExpressionPreviewProps {
  value: string
  placeholder?: string
  variables: ExpressionVariableOption[]
  /** Asks for the real editor; `point` is where the press landed, if any. */
  onActivate: (point: ExpressionPreviewPoint | null) => void
}

/**
 * A read-only stand-in for the CodeMirror editor.
 *
 * It copies the editor's box (see `.expression-preview` in `style.css`) and its
 * template highlighting, so swapping one for the other does not move the
 * node around it. Hundreds of these cost next to nothing, where hundreds of
 * live editors block the first render of a large canvas for seconds.
 */
export function ExpressionPreview({
  value,
  placeholder,
  variables,
  onActivate,
}: ExpressionPreviewProps) {
  const isEmpty = value.length === 0
  const content = useMemo(
    () => renderHighlightedValue(value, variables),
    [value, variables]
  )

  return (
    <div
      role="textbox"
      tabIndex={0}
      aria-multiline="true"
      aria-placeholder={placeholder}
      data-expression-preview=""
      data-empty={isEmpty ? "" : undefined}
      // Plain classes from `style.css`, like the `.cm-*` rules they mirror.
      className="expression-preview"
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        // The editor that replaces this box takes focus itself; letting the
        // press focus the box first would only bounce focus through it.
        event.preventDefault()
        onActivate({ x: event.clientX, y: event.clientY })
      }}
      onFocus={() => onActivate(null)}
    >
      <div className="expression-preview-content">
        {isEmpty ? (placeholder ?? "") : content}
      </div>
    </div>
  )
}

function renderHighlightedValue(
  value: string,
  variables: ExpressionVariableOption[]
): ReactNode[] {
  const parts: ReactNode[] = []
  let cursor = 0

  buildTemplateHighlightRanges(value, variables).forEach((range) => {
    if (range.from > cursor) {
      parts.push(value.slice(cursor, range.from))
    }
    parts.push(
      <span key={range.from} className={HIGHLIGHT_CLASS_NAMES[range.kind]}>
        {value.slice(range.from, range.to)}
      </span>
    )
    cursor = range.to
  })

  if (cursor < value.length) {
    parts.push(value.slice(cursor))
  }
  // CodeMirror draws an empty last line after a trailing newline; `pre` text
  // does not, so the preview would come out one line short.
  if (value.endsWith("\n")) {
    parts.push(" ")
  }

  return parts
}
