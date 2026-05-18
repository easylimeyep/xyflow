## 1. Config Types And Defaults

- [x] 1.1 Add Setter `variableType` to workflow config types, default config, validation, and typed config updates.
- [x] 1.2 Replace Evaluator condition `value` / `targetValue` fields with `left` / `right` typed operand objects in shared workflow types.
- [x] 1.3 Update Evaluator default config and condition validation for `string` and `array` operands.
- [x] 1.4 Update tests covering node config normalization, config update validation, and default node creation.

## 2. Extractor And Setter UI

- [x] 2.1 Extract or add a shared single-line Label/Type layout pattern for variable-producing node controls.
- [x] 2.2 Update Extractor to render `Label | Type` as the first control row, followed by Token Number and Unlimited.
- [x] 2.3 Update Setter to render `Label | Type` as the first control row, followed by Value expression and Clear.
- [x] 2.4 Add or update component tests for Extractor and Setter label/type ordering, type options, and config updates.

## 3. Evaluator Typed Operand UI

- [x] 3.1 Add helper functions for creating, switching, and updating typed evaluator operands.
- [x] 3.2 Update Evaluator condition rows to render an operand type select for the left operand.
- [x] 3.3 Update Evaluator condition rows to render an operand type select for the right operand when the operator requires a target.
- [x] 3.4 Add repeatable free-text row editing for array operands, allowing spaces and empty arrays.
- [x] 3.5 Ensure switching an array operand to string keeps the first array item or an empty string.
- [x] 3.6 Ensure targetless operators omit the right operand and target-required operators create a default string right operand.
- [x] 3.7 Add or update Evaluator component tests for string operands, array operands, empty arrays, spaces, independent operand type changes, and operator transitions.

## 4. Persistence And Export

- [x] 4.1 Update domain import/export and clipboard fixtures/tests to use Setter `variableType` and Evaluator typed operands.
- [x] 4.2 Update backend export fixtures/tests to preserve the new Evaluator typed operand condition shape.
- [x] 4.3 Update expression dependency and variable catalog tests affected by Setter config shape changes.
- [x] 4.4 Remove or update any obsolete tests or fixtures that assert the old Evaluator `value` / `targetValue` shape.

## 5. Verification

- [x] 5.1 Run targeted package tests for workflow node components, node config updates, mappers, clipboard, and backend export.
- [x] 5.2 Run package typecheck and lint for affected workspaces.
- [x] 5.3 Run existing workflow editor smoke/e2e coverage if UI behavior changes are not fully covered by unit tests.
