## 1. Effective Type Inference

- [x] 1.1 Add evaluator-side effective left type derivation that preserves declared `array` behavior and attempts inference only for declared `value` operands.
- [x] 1.2 Resolve inferred variable type from reachable upstream producer metadata (`setVariable`/`extractor` `config.variableType`) with deterministic fallback to `value` when unresolved.
- [x] 1.3 Keep persisted evaluator condition schema unchanged while routing operator catalog selection through derived effective type.

## 2. Evaluator UI Behavior

- [x] 2.1 Update evaluator operator selection logic to use effective left type and auto-reconcile to the first valid operator when the current operator becomes invalid.
- [x] 2.2 Preserve right operand reconciliation behavior based on selected operator `allowTypes` after operator auto-replacement.
- [x] 2.3 Add unresolved-variable warning chip in the top-right of the left expression input with yellow styling and tooltip copy.
- [x] 2.4 Handle upstream variable rename/delete transitions so unresolved expressions revert to value operator catalog and show warning chip state.

## 3. Verification

- [x] 3.1 Add or update evaluator component/store tests for: inferred array type, inferred value fallback, unresolved variable warning chip, and rename/delete fallback.
- [x] 3.2 Add or update evaluator tests for invalid-operator reconciliation when effective type flips.
- [x] 3.3 Run flow package test suite and lint/type checks covering evaluator changes.