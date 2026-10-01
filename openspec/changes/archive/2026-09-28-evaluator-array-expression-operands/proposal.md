## Why

An evaluator `value` operand is an expression: users can type `{{ city }}`, get autocomplete, and see a warning when the variable does not resolve. An `array` operand is plain free text — rows cannot reference variables with any editor support, so conditions such as "status is one of [`draft`, `{{ defaultStatus }}`]" are unsupported in practice. Separately, renaming a variable never rewrites references inside evaluator conditions, so every reference users add there silently breaks on rename.

## What Changes

- Evaluator array operand rows become expression rows with the same variable autocomplete and variable chips as a value operand. Each row still stores one template string, so the stored shape stays `string[]` (no schema or persistence change).
- A row may be a literal (`Moscow`), a single variable (`{{ city }}`), or mixed text (`prefix-{{ id }}`). A row referencing an array variable is allowed; flattening it into the resulting list is the backend's job, and the editor does not interpret it.
- The array operand trigger preview renders variable-reference rows as variable badges, visually distinct from literal badges.
- The unresolved-variable warning applies to every operand the user types: left and right, value and array. For array operands, an unresolved row's preview badge carries a small warning icon with a tooltip. Only the left value operand's resolution still drives operator-group selection.
- The array operand popover content may be wider than its trigger, so expression rows and their autocomplete have room.
- Draft array edits capture in-progress typing, so closing the popover while a row is focused does not lose the last edit.
- Renaming a variable rewrites references inside evaluator and JSON evaluator conditions — both operands, value and array rows.
- The reusable array input popover (UI package) gains a row-render slot so the workflow editor can supply the row editor while the component stays workflow-agnostic.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `workflow-evaluator-node`: array operand rows become expression rows; unresolved-variable warnings extend to both operands and to array rows; array preview distinguishes variable rows; draft commit captures in-progress row edits; the reusable popover accepts a row-render slot; condition operands participate in rename refactoring.
- `store-extensible-node-config`: rename refactoring reaches expression templates nested inside structured config values (such as evaluator conditions) through definition-declared behavior, not only top-level string and string-array keys.

## Impact

- `packages/ui`: `ArrayInputPopover` — row-render slot, preview badge variants (variable, unresolved), popover width decoupled from trigger. Default behavior for other consumers is unchanged.
- `packages/flow/src/workflow/nodes/logic/evaluator-shared/`: `operand-editor.tsx`, `operands.ts`, `condition-row.tsx` — expression rows, shared unresolved-variable detection, variable types passed to the right operand.
- `packages/flow/src/workflow/node-registry/define-node.ts` and `expression/refactor/refactor.ts`: a definition-level hook for refactoring nested config values.
- `evaluator` and `jsonEvaluator` definitions declare the new refactor behavior for `conditions`.
- No changes to stored config shape, import/export, or backend contract.
