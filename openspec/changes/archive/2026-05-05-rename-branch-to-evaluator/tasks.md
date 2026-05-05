## 1. Rename Node Contract

- [x] 1.1 Rename the logic node module, exports, component names, styles, tests, and registry entries from branch/Branch to evaluator/Evaluator where they represent the workflow node.
- [x] 1.2 Change the canonical node kind from `branch` to `evaluator` in Node API v2 definitions, type maps, defaults, validation, graph insertion, and node palette metadata.
- [x] 1.3 Rename output handle ids from `branch-true` / `branch-false` to `evaluator-true` / `evaluator-false` in node definitions, edge routing, layout helpers, examples, tests, and snapshots.
- [x] 1.4 Update active documentation and specs references that describe the current workflow node contract, leaving historical archive content untouched unless required by validation.

## 2. Runtime And UI Behavior

- [x] 2.1 Rename branch operator runtime config to evaluator operator runtime config while preserving the existing operator definition shape.
- [x] 2.2 Add `enableEvaluatorMultipleConditions` to the mounted editor runtime with a default of `false`.
- [x] 2.3 Update evaluator condition rendering so the disabled flag hides `Add Condition`, hides logical operator separators, and renders only the first stored condition.
- [x] 2.4 Preserve the full `conditions` array and `logicalOperator` values when multi-condition editing is disabled, except for edits to the rendered first condition.
- [x] 2.5 Ensure enabling `enableEvaluatorMultipleConditions` restores the existing multi-condition add, delete, reorder, and logical operator controls without changing stored config format.

## 3. Persistence, Examples, And Tests

- [x] 3.1 Update domain import/export and clipboard tests so evaluator config and `evaluator-*` handles roundtrip correctly.
- [x] 3.2 Add regression coverage that `branch` payloads are rejected as unsupported node kinds.
- [x] 3.3 Update web example graphs and package examples to use `evaluator` nodes and `evaluator-*` handles.
- [x] 3.4 Update component tests for the feature flag default-hidden behavior and enabled multi-condition behavior.
- [x] 3.5 Run targeted package tests for workflow mappers, validation, store/edge routing, and evaluator component behavior.
