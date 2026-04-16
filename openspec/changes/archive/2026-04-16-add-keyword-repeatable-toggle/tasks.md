## 1. Extend Keyword config model

- [x] 1.1 Add `repeatable` to `InlineExpressionNodeConfig` and keep its type boolean.
- [x] 1.2 Update the `inlineExpression` node definition defaults and validation to include `repeatable: false`.

## 2. Add Repeatable control to Keyword node UI

- [x] 2.1 Render a `Repeatable` checkbox below the `Tokens` input in `InlineExpressionNode`.
- [x] 2.2 Wire the checkbox to `updateNodeConfig` so toggling it persists the `repeatable` value in store state.

## 3. Verify behavior with tests

- [x] 3.1 Extend `inline-expression-node.test.tsx` to cover rendering and config updates for the `Repeatable` checkbox.
- [x] 3.2 Add or update a config-shape test to verify new `Keyword` nodes default to `repeatable: false`.
