## Why

Evaluator boolean operators are currently a flat runtime list, so the editor cannot express that available operators and right operand types depend on the left operand type. Consumers now need to pass evaluator operators in a typed catalog keyed by operand type so workflow editing matches the backend operator schema.

## What Changes

- **BREAKING** Replace the flat `runtime.evaluator.operators` array with a typed operator catalog keyed by `string` and `array`.
- Replace operator `requiresTarget` metadata with `allowTypes`, where `["none"]` means the operator is unary and omits the right operand.
- Filter evaluator operator options by the current left operand type.
- Restrict the right operand type picker to the selected operator's allowed right operand types.
- Reset incompatible operators and right operands to valid defaults when users change the left operand type or selected operator.
- Keep the persisted evaluator condition shape as typed operands plus stored operator id.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workflow-branch-operator-options`: evaluator operator definitions become type-aware and use `allowTypes` instead of `requiresTarget`.
- `workflow-evaluator-node`: evaluator condition editing now derives operators and right operand controls from the left operand type and selected operator metadata.
- `workflow-editor-compound-api`: the public runtime API for evaluator operators changes to the typed catalog format.

## Impact

- Public runtime API: `WorkflowRuntimeConfig.evaluator.operators`.
- Evaluator operator types and default operator catalog.
- Runtime normalization for evaluator operators.
- Evaluator node condition UI, add-condition behavior, and operand type change behavior.
- Unit tests for runtime normalization and evaluator condition editing.
- OpenSpec requirements that currently state operators are not filtered by operand type.
