## Why

Expression inputs currently render with two visible borders: the reusable `ExpressionEditor` wrapper draws a rounded `border border-input`, and the nested CodeMirror `.cm-editor` draws its own `1px` border. In compact workflow node forms, especially Keyword token rows, this creates a doubled outline that looks heavier than other controls and makes the input feel visually misaligned with the rest of the node UI.

The expression editor should present as a single bordered control while preserving CodeMirror behavior, rounded clipping, validation, autocomplete, and popover anchoring.

## What Changes

- Remove the redundant inner CodeMirror border from expression editor rendering.
- Keep one visible border on the expression editor container so rounding and overflow remain controlled by the wrapper.
- Preserve existing editor background, text, cursor, selection, tooltip, validation, commit, and autocomplete behavior.
- Verify expression inputs in Keyword token rows and other workflow node fields render with only one visible input border.

## Capabilities

### Modified Capabilities

- `reusable-expression-editor-package`: Expression editor visual structure guarantees a single visible input border for the CodeMirror-backed control.

## Impact

- Affected code is expected in `packages/expression-editor/src/style.css` and possibly `packages/expression-editor/src/components/expression-editor/expression-editor.styles.ts` if the final implementation chooses the CodeMirror element as the single border owner instead.
- No persisted workflow data, expression parsing, autocomplete, or store behavior should change.
- Requires focused visual/style regression coverage or DOM assertions that prevent reintroducing both wrapper and CodeMirror borders.
