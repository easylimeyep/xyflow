# Add Case Sensitive Toggle

## What

Add a `Case sensitive` checkbox to `Keyword` and `Evaluator` nodes so authors can choose whether backend string matching should respect letter case.

The selected value will persist on the node config as the boolean key `caseSensitive`, matching the backend-facing field name requested for this workflow payload.

## Why

Keyword token matching and evaluator comparisons currently do not expose case handling in the editor, so workflow authors cannot declare whether values like `Email` and `email` should be treated as equivalent. Persisting the explicit flag lets the backend apply the intended comparison behavior without inferring it from operator or token content.

## Scope

- Render a `Case sensitive` checkbox in the `Keyword` node body as a shared matching option near the existing `Repeatable` toggle.
- Render a `Case sensitive` checkbox in the `Evaluator` node body below the condition list and before `+ Add Condition`.
- Store the flag as `caseSensitive` on `inlineExpression` and `evaluator` node configs.
- Default the flag to `false` for new nodes and normalize missing legacy values to `false`.
- Preserve the flag through domain import/export and clipboard roundtrips.

## Non-goals

- Change backend comparison behavior inside the frontend package.
- Add per-token or per-condition case sensitivity.
