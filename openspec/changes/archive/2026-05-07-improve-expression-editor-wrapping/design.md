## Context

`ExpressionEditor` is the reusable CodeMirror-backed editor used by workflow expression fields. It currently configures CodeMirror with `EditorView.lineWrapping`:

```text
ExpressionEditor
  extensions
    - javascript()
    - template highlighting
    - EditorView.lineWrapping
    - commit behavior
```

That extension makes long document lines wrap visually when they exceed the available width. This is useful for prose-like fields, but expression values are closer to code: the difference between one logical line and several logical lines matters when reading and editing.

The editor is also intentionally compact. `basicSetup` disables line numbers, and the wrapper owns the visible border and rounded clipping. Adding a gutter to every expression field would make narrow node forms noisier and reduce the editable width.

## Goals / Non-Goals

**Goals:**

- Make one logical expression line look like one visual line.
- Use horizontal scrolling for long lines that exceed the editor width.
- Keep real newline characters visibly distinct as additional vertical lines.
- Preserve the compact expression input shape without default line numbers.
- Keep all existing expression authoring behavior unchanged apart from soft wrapping.
- Keep the fix inside the reusable expression editor package so all consumers behave consistently.

**Non-Goals:**

- Add line numbers to the compact expression editor by default.
- Add a separate expanded editor mode.
- Redesign expression input typography, borders, focus rings, validation UI, or variable picker UI.
- Change Enter or Shift+Enter semantics.
- Change expression parsing, validation, highlighting, or persisted workflow data.

## Decisions

### Decision: Disable CodeMirror soft wrapping

Remove `EditorView.lineWrapping` from the rendered editor's extension list.

Rationale: this preserves the visual meaning of logical lines. A long expression remains one row and communicates overflow through horizontal scroll, while a real newline creates another row.

```text
Before
┌──────────────────────────────┐
│ {{ $node("LongName").output. │
│ value }}                     │
└──────────────────────────────┘

After
┌──────────────────────────────┐
│ {{ $node("LongName").output… │  horizontal scroll
└──────────────────────────────┘
```

### Decision: Use horizontal scroll rather than default line numbers

Keep `lineNumbers: false` for compact fields. If a future full-size expression editor is introduced, line numbers can be considered for that expanded mode.

Rationale: line numbers help distinguish real lines from wrapped continuations, but they also make every compact node field feel like a larger code editor. Horizontal scroll solves the immediate ambiguity with less visual weight and preserves more width for the expression itself.

### Decision: Keep real multiline editing intact

Do not change commit lifecycle behavior. The existing spec says Enter without Shift commits and blurs, while Shift+Enter does not commit and retains focus. The implementation should preserve that contract so deliberate multiline input remains possible through the existing multiline path.

### Decision: Keep wrapper clipping and border ownership

The editor container should continue to own rounded clipping and the single visible input border. Horizontal overflow should be handled inside CodeMirror's scroller, not by exposing content outside the input boundary.

### Decision: Isolate wheel gestures from the workflow canvas

The reusable editor container should prevent wheel events from bubbling to parent canvas handlers and should use React Flow's `nowheel` convention.

Rationale: once long lines scroll horizontally, users naturally use a trackpad or mouse wheel over the expression field. Without wheel isolation, React Flow can interpret that gesture as canvas pan instead of allowing the CodeMirror scroller to move. The editor should keep scroll intent local to the input surface.

### Decision: Hide scrollbar chrome without disabling scroll

The CodeMirror scroller should retain `overflow-x: auto`, while hiding visible scrollbar chrome with browser-specific scrollbar hiding rules.

Rationale: expression fields are compact inputs. A visible horizontal scrollbar makes them feel heavier and can steal vertical space, but the scroll behavior is still needed for long logical expressions.

## Risks / Trade-offs

- [Horizontal scroll discoverability] Users may not immediately notice hidden overflow. Mitigation: native horizontal scrolling is familiar in code-like fields, and the caret movement reveals overflow while editing.
- [Narrow fields] Very long expressions can require sideways navigation. Mitigation: this is preferable to ambiguous wrapped content for compact node fields; a future expanded editor could improve large-expression authoring.
- [CSS interactions] Existing `overflow-hidden` on the wrapper could accidentally hide scrollbars or clipped content incorrectly. Mitigation: ensure CodeMirror's `.cm-scroller` owns horizontal overflow behavior and test the stylesheet contract.
- [Canvas event conflicts] Horizontal scroll can be captured by the workflow graph. Mitigation: mark the editor surface with `nowheel` and stop wheel propagation from the editor container.
- [Hidden affordance] Hiding the scrollbar can make overflow less obvious. Mitigation: caret movement, selection, and trackpad/mouse-wheel scrolling still expose hidden content during editing.
- [Regression in multiline editing] Removing soft wrapping must not remove real newline support. Mitigation: preserve key handling and add coverage or manual verification for Shift+Enter/newline display.

## Verification Plan

1. Add or update stylesheet coverage proving the expression editor does not enable CodeMirror line wrapping and allows horizontal scrolling within the editor scroller.
2. Add or update integration coverage proving editor wheel events do not bubble to parent canvas containers.
3. Add or update integration coverage showing real newline content still renders as separate document lines.
4. Run expression editor tests covering commit lifecycle, validation, highlighting, variable insertion, style, and autocomplete behavior.
5. Run relevant flow/node tests that cover Keyword token rows and expression fields.
6. Manually verify the web example: enter a long expression in a Keyword token row and confirm it scrolls horizontally without panning the graph; enter a real newline with Shift+Enter and confirm it appears as a distinct vertical line.
