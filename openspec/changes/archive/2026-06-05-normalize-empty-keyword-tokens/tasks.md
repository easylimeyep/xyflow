## 1. Regression Coverage

- [x] 1.1 Add a component test proving clearing the only stored keyword token persists `template: []`.
- [x] 1.2 Update the empty visual state add-row test so empty UI rows are not expected in persisted config.
- [x] 1.3 Add coverage for mixed empty and non-empty valid token rows persisting only non-empty tokens in order.

## 2. Keyword Token Normalization

- [x] 2.1 Add a local helper in `KeywordExpressionListInput` that removes empty string rows before committed `onChange` calls.
- [x] 2.2 Apply the helper in `updateRow`, `addRow`, and `removeRow` without changing invalid-row blocking behavior.
- [x] 2.3 Preserve the existing one-empty-row visual state when the committed keyword token array is empty.

## 3. Verification

- [x] 3.1 Run the inline expression node component tests.
- [x] 3.2 Run the relevant workflow store or mapper tests if implementation touches store-level normalization. (Not needed; implementation stayed component-local.)
- [x] 3.3 Confirm OpenSpec status reports the change as ready for apply/archive flow.
