## 1. Native Type Select Component

- [x] 1.1 Create a workflow-specific native type select component that composes `NativeSelect` and `NativeSelectOption`.
- [x] 1.2 Map `value` and `array` to the existing type icons for the collapsed control while keeping native text options.
- [x] 1.3 Support `allowedTypes`, `ariaLabel`, `className`, `size`, `value`, and `onChange` props needed by current type picker usages.
- [x] 1.4 Style the component with `tv` in `packages/flow`, preserving compact icon-button dimensions for default and small sizes.

## 2. Node UI Migration

- [x] 2.1 Replace Extractor variable type `WorkflowTypePicker` usage with the native workflow type select.
- [x] 2.2 Replace Setter variable type `WorkflowTypePicker` usage with the native workflow type select.
- [x] 2.3 Replace Evaluator operand type `WorkflowTypePicker` usage with the native workflow type select while preserving right operand allowed-type filtering.
- [x] 2.4 Remove or retire the old popover-only `WorkflowTypePicker` module if no usages remain.

## 3. Tests

- [x] 3.1 Update Extractor node tests to change the type through native select events and assert persisted config updates.
- [x] 3.2 Update Setter node tests to change the type through native select events and assert persisted config updates.
- [x] 3.3 Update Evaluator node tests to use native select events for left and right operand type changes.
- [x] 3.4 Add or update assertions that restricted evaluator operand types are reflected as native select options.

## 4. Verification

- [x] 4.1 Run the focused `packages/flow` tests covering Extractor, Setter, and Evaluator node components.
- [x] 4.2 Run the relevant typecheck or lint command for the touched workspace package if available.
- [x] 4.3 Inspect the final diff to confirm no persistence, schema, or runtime export behavior changed.
