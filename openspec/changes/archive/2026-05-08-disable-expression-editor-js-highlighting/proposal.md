## Why

Expression inputs currently use CodeMirror's JavaScript language extension. That makes ordinary literal text inside mixed template fields look syntax-highlighted as JavaScript, even when the user is just writing plain text.

We recently added template-specific highlighting for `{{ ... }}` references. The editor should now make that template highlighting the only semantic color treatment: normal text should render like ordinary input text, while `{{` / `}}` delimiters and known variable bodies remain visually distinguishable.

## What Changes

- Disable JavaScript syntax highlighting in the reusable CodeMirror-backed `ExpressionEditor`.
- Keep the existing template highlighting extension for `{{ ... }}` delimiters and known variable bodies.
- Render all literal text and unknown expression bodies with the editor's default foreground styling.
- Preserve validation, blur commit, Enter commit, live change reporting, external value sync, horizontal scrolling, and the custom `{{}}` variable picker.
- Keep the public `ExpressionEditor` and flow `ExpressionInput` APIs unchanged.

## Capabilities

### Modified Capabilities

- `reusable-expression-editor-package`: Expression editor renders plain/literal text without JavaScript syntax highlighting while retaining template-specific highlighting for `{{ ... }}` references.

## Impact

- Affected code is expected in `packages/expression-editor/src/components/expression-editor/expression-editor.tsx`, where CodeMirror extensions are configured.
- Affected tests are expected in `packages/expression-editor/src/components/expression-editor/expression-editor.integration.test.tsx`, `packages/expression-editor/src/highlighting/highlighting.test.ts`, or package style tests if existing coverage needs to assert the absence of JavaScript token styling.
- No persisted workflow data, expression parsing semantics, validation rules, variable collection, autocomplete/picker behavior, or flow store behavior should change.
