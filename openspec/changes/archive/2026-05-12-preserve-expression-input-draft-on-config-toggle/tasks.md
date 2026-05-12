## 1. Regression Coverage

- [x] 1.1 Add a reusable expression editor integration test proving that a focused uncommitted draft survives a parent re-render with the same committed `value`.
- [x] 1.2 Add a reusable expression editor integration test proving that an unfocused editor still syncs when the committed `value` prop changes externally.
- [x] 1.3 Add a Keyword node regression test using the real `ExpressionInput` path where typing a token draft and toggling `Case sensitive` preserves the visible draft while updating `caseSensitive`.

## 2. Draft Preservation Implementation

- [x] 2.1 Update `ExpressionEditor` so focused live editor content is not overwritten by unrelated renders with the same committed `value`.
- [x] 2.2 Preserve blur, Enter, and variable-insertion commit behavior without committing every keystroke.
- [x] 2.3 Verify whether `KeywordExpressionListInput` live draft identity needs adjustment after the editor fix; update it only if the Keyword regression still fails.

## 3. Verification

- [x] 3.1 Run the expression editor integration tests.
- [x] 3.2 Run the Keyword/inline-expression node tests.
- [x] 3.3 Run the relevant OpenSpec validation/status command for this change and confirm it is apply-ready.
