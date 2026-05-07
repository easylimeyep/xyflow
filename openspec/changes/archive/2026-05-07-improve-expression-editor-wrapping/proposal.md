## Why

Expression editor fields currently soft-wrap long logical lines. A long single-line expression can therefore occupy multiple visual rows, while a value with real newline characters also occupies multiple visual rows. In compact workflow node forms this makes two different authoring states look the same:

```text
one logical line that soft-wraps
{{ $node("VeryLongNodeName").output.really.long.path }}

multiple logical lines entered with a real newline
{{ condition
  ? valueA
  : valueB }}
```

Users need to understand whether an expression contains actual newline characters or whether the editor merely wrapped content because the node field is narrow. The editor should preserve that distinction visually without turning every compact expression input into a full code editor.

## What Changes

- Disable soft line wrapping in the reusable CodeMirror-backed expression editor.
- Allow long logical lines to remain on one visual row and scroll horizontally inside the editor.
- Hide the visual horizontal scrollbar while preserving horizontal scroll behavior.
- Prevent wheel or trackpad scroll gestures over the editor from panning the surrounding workflow graph.
- Keep real newline characters rendered as additional vertical editor lines.
- Keep line numbers disabled for the compact expression editor by default.
- Preserve validation, highlighting, custom variable picker behavior, blur commit, Enter commit, Shift+Enter multiline editing, external value sync, and the single visible input border.
- Verify horizontal overflow does not leak outside the rounded input wrapper or break variable picker anchoring.

## Capabilities

### Modified Capabilities

- `reusable-expression-editor-package`: Expression editor rendering distinguishes soft overflow from real newline characters by using horizontal scrolling for long logical lines instead of visual line wrapping.

## Impact

- Affected code is expected in `packages/expression-editor/src/components/expression-editor/expression-editor.tsx`, where CodeMirror extensions currently include `EditorView.lineWrapping`.
- Affected styling is expected in `packages/expression-editor/src/style.css` and possibly `packages/expression-editor/src/components/expression-editor/expression-editor.styles.ts` if wrapper overflow behavior needs adjustment.
- Affected tests are expected in `packages/expression-editor/src/components/expression-editor/expression-editor.integration.test.tsx` and `packages/expression-editor/src/style.test.ts`.
- Workflow canvas integration depends on the reusable editor isolating wheel events so React Flow does not treat expression field scrolling as graph panning.
- No persisted workflow data, expression parsing, validation rules, variable collection, autocomplete helpers, or store behavior should change.
