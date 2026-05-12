## 1. Regression Coverage

- [x] 1.1 Add a Keyword expression-list test proving `Add token` preserves a valid draft typed into the empty visual row and persists `[typedValue, ""]`.
- [x] 1.2 Add a Keyword expression-list test proving `Add token` preserves a valid draft typed over an existing stored row and persists `[editedValue, ""]`.
- [x] 1.3 Add or update coverage for invalid live token drafts so row actions do not persist whitespace-bearing invalid values.

## 2. Row Action Implementation

- [x] 2.1 Refactor `KeywordExpressionListInput` so append actions derive their base from current visible valid rows rather than stale committed `value`.
- [x] 2.2 Review remove-row behavior for the same live-draft boundary and update it to preserve valid visible remaining rows without persisting invalid drafts.
- [x] 2.3 Keep the empty visual state behavior intact: an empty stored template still renders one editable row, and adding from a truly empty row persists two empty rows.

## 3. Verification

- [x] 3.1 Run the targeted inline-expression component/integration tests that cover Keyword token rows.
- [x] 3.2 Run or document any additional relevant flow tests if the row action change touches shared config update behavior.
- [x] 3.3 Manually review the final diff against the proposal, design, and spec requirements before implementation is considered complete.
