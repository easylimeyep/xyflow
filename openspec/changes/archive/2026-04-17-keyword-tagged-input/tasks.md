## 1. Node config and persistence contract

- [x] 1.1 Update `inlineExpression` node types, defaults, and validation so `template` is stored as `string[]` and legacy scalar values normalize to a one-item array.
- [x] 1.2 Update domain/clipboard import-export and normalization tests to preserve array-backed keyword templates across roundtrips.
- [x] 1.3 Update any output-path or graph/store assertions that currently assume `inlineExpression.config.template` is a scalar string.

## 2. Keyword expression-list UI

- [x] 2.1 Create a `Keyword`-specific expression-list input wrapper that renders one `ExpressionInput` row by default and appends rows with a square plus action.
- [x] 2.2 Add hover-driven per-row delete affordances and ensure removing the final row leaves one empty editable row.
- [x] 2.3 Wire `InlineExpressionNode` to the new list input and keep the `Repeatable` toggle rendered below the `Tokens` list.

## 3. Expression semantics and regressions

- [x] 3.1 Update expression-refactor traversal so rename-driven updates rewrite every string entry in array-backed keyword templates.
- [x] 3.2 Add node/component tests covering row rendering, add/remove interactions, repeatable placement, and array-backed config updates.
- [x] 3.3 Add focused regression coverage for legacy string normalization, persistence/clipboard roundtrips, and rename refactors on keyword template arrays.
