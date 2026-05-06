## 1. Editor Behavior

- [x] 1.1 Remove the CodeMirror `autocompletion(...)` extension from the rendered `ExpressionEditor` extensions list.
- [x] 1.2 Remove now-unused rendered-editor imports and memoized completion source wiring from `ExpressionEditor`.
- [x] 1.3 Preserve `javascript()`, template highlighting, line wrapping, and commit lifecycle extensions.
- [x] 1.4 Preserve the custom `{{}}` variable picker and `insertVariable` behavior.

## 2. Tests

- [x] 2.1 Add or update an integration test proving normal token edits do not open a CodeMirror autocomplete tooltip.
- [x] 2.2 Keep or update coverage proving the custom picker still opens from `{{}}` and inserts a selected variable in wrapped format.
- [x] 2.3 Keep pure autocomplete helper tests if the helper exports remain.

## 3. Verification

- [x] 3.1 Run expression editor package tests.
- [x] 3.2 Run affected flow tests for expression fields or evaluator node behavior.
- [x] 3.3 Manually verify `http://localhost:3001/` in the `with elk graph` tab: editing `Evaluator` value from `{{ email }}` to `{{ emai }}` and back does not show a clipped CodeMirror autocomplete popup.
