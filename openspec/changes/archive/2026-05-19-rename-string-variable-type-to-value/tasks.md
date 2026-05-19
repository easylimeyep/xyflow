## 1. Core Type Model

- [x] 1.1 Update `WorkflowVariableType`, `WorkflowTypedValue`, built-in evaluator operator catalogs, and related exported types to use `value | array`.
- [x] 1.2 Update Extractor, Setter, and Evaluator default configs so new nodes persist `variableType: "value"` and operand `type: "value"`.
- [x] 1.3 Reject stale workflow type literal `string` at node config/import boundaries without changing ordinary JavaScript string validation.

## 2. Evaluator Runtime and UI

- [x] 2.1 Update evaluator operand creation, type switching, operator reconciliation, and target-right-operand logic to use `value` for scalar operands.
- [x] 2.2 Reject runtime evaluator operator catalogs that contain `string` group keys or `allowTypes` entries.
- [x] 2.3 Update the shared workflow type picker labels, allowed type filtering, and Extractor/Setter/Evaluator UI assertions to present `value` and `array`.

## 3. Persistence, Fixtures, and Tests

- [x] 3.1 Update mappers, clipboard handling, initial graph builders, registry tests, and backend export fixtures so persisted workflow type literals use `value`.
- [x] 3.2 Add focused regression coverage showing stale `string` variable types and evaluator operands are rejected.
- [x] 3.3 Run the relevant `packages/flow` typecheck/test suite and fix any remaining string-literal assumptions.
