## Why

Evaluator currently chooses operator options only from the declared left operand type (`value` or `array`). This breaks expected behavior for template-based expressions like `{{ items }}` where the upstream variable type is already known, and users can end up with mismatched operators without clear feedback.

## What Changes

- Update evaluator condition behavior so left operand operator options use an inferred effective type when left operand is `value` and contains a resolvable template variable.
- Infer variable type from reachable upstream variable-producing nodes (`setVariable` and `extractor`) via their persisted `config.variableType`.
- Keep current behavior unchanged when left operand type is explicitly `array`.
- Add unresolved-variable UI signal for evaluator left `ExpressionInput`: yellow chip in the input top-right corner with tooltip explaining the variable could not be resolved.
- Use string (`value`) operator catalog as default fallback whenever inference is not possible (including unknown variable and non-single-variable expressions).
- Reconcile operator on type flip by auto-selecting the first valid operator for the new effective type.
- Keep evaluator persistence format and workflow import/export contracts unchanged for backward compatibility.
- **BREAKING**: none.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workflow-evaluator-node`: evaluator operator selection now supports effective type inference from upstream variable metadata, unknown-variable signaling, and automatic operator reconciliation on inferred type changes.

## Impact

- Affected code:
  - `packages/flow/src/workflow/nodes/logic/evaluator/component.tsx`
  - `packages/flow/src/workflow/expression/variables/variables.ts` (or adjacent selector/data-shaping layer used by evaluator variable resolution)
  - evaluator-related tests in `packages/flow/src/workflow/nodes/logic/evaluator/` and store/expression selector tests.
- No changes to node config schema (`EvaluatorCondition`, import/export DTOs, backend mapper contracts).
- No new dependencies.
