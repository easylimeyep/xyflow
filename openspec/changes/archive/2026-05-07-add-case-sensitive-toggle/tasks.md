# Tasks

- [x] 1. Update node config schema/defaults
  - [x] 1.1 Add `caseSensitive: boolean` to `InlineExpressionNodeConfig` and `EvaluatorNodeConfig`.
  - [x] 1.2 Initialize new keyword and evaluator nodes with `caseSensitive: false`.
  - [x] 1.3 Normalize missing legacy config values to `false` for both node kinds.

- [x] 2. Add node UI controls
  - [x] 2.1 Add `Case sensitive` checkbox to `Keyword` below `Tokens`, grouped with the existing node-level toggles.
  - [x] 2.2 Add `Case sensitive` checkbox to `Evaluator` below the condition list and before `+ Add Condition`.
  - [x] 2.3 Write toggle updates through `updateNodeConfig` using key `caseSensitive`.

- [x] 3. Preserve persistence semantics
  - [x] 3.1 Ensure domain export/import preserves `caseSensitive` on keyword and evaluator nodes.
  - [x] 3.2 Ensure clipboard copy/paste preserves `caseSensitive` on keyword and evaluator nodes.

- [x] 4. Add regression coverage
  - [x] 4.1 Cover keyword checkbox rendering and update behavior.
  - [x] 4.2 Cover evaluator checkbox rendering and update behavior.
  - [x] 4.3 Extend config normalization and mapper tests for the new boolean.
