## Why

`Keyword` currently exposes a single expression field, which makes multi-token keyword flows awkward to author and obscures the intended relationship between repeatable matching and multiple keyword expressions. We need a node experience that lets authors manage several full expression inputs directly inside the card while preserving workflow semantics across editing, persistence, and refactoring.

## What Changes

- Replace the single `Tokens` field in `Keyword` with a custom expression-list input that renders one `ExpressionInput` row at a time and supports adding more rows with a square plus action.
- Show keyword expressions as a vertical list and reveal a corner-positioned delete badge on hover for removable rows.
- Store `Keyword` `template` values as an ordered array of strings instead of a single string.
- Preserve full expression behavior for every keyword row, including `{{ }}` validation, autocomplete, persistence, clipboard roundtrips, and expression refactors.
- Keep `Repeatable` on `Keyword`, but anchor its UI and semantics to the new multi-expression keyword model.

## Capabilities

### New Capabilities
- `keyword-tagged-input`: `Keyword` supports an ordered list of full expression inputs with add/remove interactions and array-backed template storage.

### Modified Capabilities
- `keyword-repeatable-toggle`: `Keyword` repeatable behavior and UI are updated to work with the new multi-expression `Tokens` input model.

## Impact

- Affected code in `packages/flow/src/workflow/nodes/data/inline-expression/*`, `packages/flow/src/workflow/components/expression-input/*`, workflow node config/types, normalization, mappers, clipboard/domain persistence, and expression refactor coverage.
- Changes the persisted shape of `inlineExpression.config.template` from `string` to `string[]`.
- Requires targeted test updates across node rendering, graph/store updates, persistence roundtrips, and expression refactor behavior.
