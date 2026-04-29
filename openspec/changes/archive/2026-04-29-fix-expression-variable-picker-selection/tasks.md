## 1. Regression Coverage

- [x] 1.1 Add a test for `KeywordExpressionListInput` where typing `{{}}` opens the picker and the first variable click inserts the selected expression.
- [x] 1.2 Assert the inserted value is committed in `{{ variable }}` form and the picker closes after insertion.

## 2. Core Fix

- [x] 2.1 Replace value-derived row keys in `KeywordExpressionListInput` with stable row identity that does not change while editing.
- [x] 2.2 Verify `ExpressionInput` still commits on blur/Enter and still commits immediately on variable insertion.
- [x] 2.3 Check whether any picker blur/focus guard is still needed after stable row identity; keep changes scoped to expression picker behavior.

## 3. Verification

- [x] 3.1 Run targeted flow tests for expression input and inline expression list behavior.
- [x] 3.2 Manually verify `http://localhost:3000/`: type `{{}}` in an expression input, click a variable once, and confirm it inserts instead of only closing the picker.
