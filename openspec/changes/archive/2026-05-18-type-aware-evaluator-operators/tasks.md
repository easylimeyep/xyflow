## 1. Runtime Operator Contract

- [x] 1.1 Replace the flat evaluator operator type with a typed catalog keyed by `string` and `array`.
- [x] 1.2 Replace `requiresTarget` with `allowTypes` and add the `none` sentinel type for unary operators.
- [x] 1.3 Update the built-in evaluator operator catalog with default `string` and `array` operator groups.
- [x] 1.4 Update runtime normalization to validate typed operator groups, scoped duplicate ids, and strict `allowTypes` rules.
- [x] 1.5 Update runtime/store tests for default catalog fallback, custom typed catalogs, invalid groups, duplicate ids, and unsupported flat arrays.

## 2. Evaluator Condition Editing

- [x] 2.1 Refactor evaluator condition rows to resolve operator options from `operators[condition.left.type]`.
- [x] 2.2 Add helpers to reconcile operator and right operand state from the active left operand type and selected operator `allowTypes`.
- [x] 2.3 Update left operand type changes to keep compatible operators, otherwise select the first operator from the new type group.
- [x] 2.4 Update operator changes to remove `right` for `["none"]` and create an empty right operand for the first allowed operand type when needed.
- [x] 2.5 Restrict the right operand type picker to the selected operator's allowed operand types.
- [x] 2.6 Remove unknown-operator fallback option behavior from the evaluator condition select.

## 3. Tests And Documentation

- [x] 3.1 Update evaluator component tests for type-filtered operator lists and left type reconciliation.
- [x] 3.2 Update evaluator component tests for unary `allowTypes`, required right operands, incompatible right operand recreation, and restricted right type choices.
- [x] 3.3 Update workflow editor/runtime API tests and TypeScript expectations for the breaking runtime operator format.
- [x] 3.4 Update examples or fixtures that pass evaluator runtime operators from `requiresTarget` to `allowTypes`.
- [x] 3.5 Run focused flow package tests covering runtime normalization, evaluator component behavior, and workflow store roundtrips.
