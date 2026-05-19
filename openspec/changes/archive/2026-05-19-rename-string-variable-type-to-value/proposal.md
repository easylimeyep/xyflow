## Why

Variable and evaluator type metadata currently uses `string` as the scalar type name. The runtime and UI need the scalar value type to be named `value` instead, so persisted configs, operator catalogs, and tests speak the same product vocabulary.

## What Changes

- **BREAKING** Rename the scalar workflow variable type literal from `string` to `value` wherever it represents a workflow value type.
- **BREAKING** Rename evaluator scalar operand `type: "string"` to `type: "value"` while keeping the operand payload key `value`.
- Update default configs, validation, runtime operator catalogs, type pickers, UI labels, mappers, fixtures, and tests to use `value` and `array`.
- Preserve ordinary TypeScript/string data validation semantics, such as `typeof x === "string"` and arrays of JavaScript strings; only workflow type literals are renamed.
- **BREAKING** Reject stale workflow type literal `string` after the rename instead of normalizing it to `value`.

## Capabilities

### New Capabilities

### Modified Capabilities

- `workflow-variable-config`: Variable-producing node type metadata uses `value` instead of `string` for scalar values.
- `workflow-evaluator-node`: Evaluator typed operands use `value` instead of `string` for scalar operands.
- `workflow-branch-operator-options`: Evaluator operator catalogs and allowed right operand type metadata use `value` instead of `string`.

## Impact

- Affected code: `packages/flow/src/workflow/types/variable-types.ts`, evaluator node definitions/components, extractor/setter definitions/components, workflow type picker, node registry validation, mappers, initial graph fixtures, clipboard/persistence tests, and related unit tests.
- Affected API/config shape: `config.variableType`, evaluator operand `type`, evaluator operator catalog keys, and operator `allowTypes` entries.
- Compatibility: Existing persisted workflows or imports containing workflow type literal `string` are invalid; callers must emit `value` or `array`.
