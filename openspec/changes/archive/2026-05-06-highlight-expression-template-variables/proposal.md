## Why

Expression inputs currently render template references such as `{{ myVar }}` with the same visual treatment as surrounding literal text. In dense workflow node forms this makes variable references hard to scan, especially when literal text and expressions are mixed in one field.

The editor should visually distinguish template expressions without changing the stored value, validation, autocomplete, variable picker, or commit behavior.

## What Changes

- Add syntax highlighting for template expressions inside the reusable CodeMirror-backed `ExpressionEditor`.
- Render `{{` and `}}` delimiters in a muted style.
- Render the expression body with an accent style only when the trimmed expression matches a known variable from the prepared `variables` catalog.
- Leave unknown expression bodies unaccented for now, while still muting their delimiters.
- Keep the behavior local to `@workspace/expression-editor` so all workflow expression fields benefit consistently.

## Capabilities

### Modified Capabilities

- `reusable-expression-editor-package`: Expression editor visually distinguishes known template variables from literal text.

## Impact

- Affected code is expected in `packages/expression-editor/src/components/expression-editor/expression-editor.tsx`, `packages/expression-editor/src/style.css`, and a new highlighting helper/extension inside `packages/expression-editor/src`.
- No persisted workflow data, expression parsing semantics, autocomplete behavior, validation rules, or flow store behavior should change.
- Requires focused unit/integration coverage for decoration ranges and stylesheet classes.
