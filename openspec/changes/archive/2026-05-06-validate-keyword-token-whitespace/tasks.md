## 1. Validation behavior

- [x] 1.1 Add a Keyword token row validator that accepts empty rows, single literal tokens without whitespace, and single `{{ ... }}` variable-expression tokens.
- [x] 1.2 Prevent newly invalid whitespace-bearing row edits from being persisted to `inlineExpression.config.template`.
- [x] 1.3 Surface row-level validation feedback when a token row contains invalid whitespace or mixes literal text with a variable expression.

## 2. Keyword UI integration

- [x] 2.1 Wire the validator into `KeywordExpressionListInput` without changing add/remove row behavior.
- [x] 2.2 Preserve variable autocomplete and normal expression validation for allowed single expression rows.
- [x] 2.3 Ensure existing stored invalid rows render without data loss so authors can correct them.

## 3. Regression coverage

- [x] 3.1 Add component tests proving literal tokens with spaces are rejected.
- [x] 3.2 Add component tests proving a single variable expression remains allowed.
- [x] 3.3 Add component tests for pasted whitespace/mixed literal-expression input and for unchanged add/remove behavior.
