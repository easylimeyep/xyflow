## Why

Workflow type controls currently look like compact icon buttons but use a custom popover interaction. We want to keep the compact icon-first presentation while switching the interaction to native select behavior for better keyboard, screen reader, and mobile platform support.

## What Changes

- Replace the workflow variable type popover picker with a domain-specific native select wrapper that still presents as an icon-sized control when collapsed.
- Keep the selectable values and labels as `value` and `array`.
- Use the native select behavior for Extractor, Setter, and Evaluator operand type controls.
- Preserve current config storage and update semantics; no persisted workflow data format changes.
- Remove or retire the old popover-only type picker once all usages move to the native-select-based control.

## Capabilities

### New Capabilities

- `workflow-type-native-select`: Covers compact icon-style native select behavior for workflow variable and operand type controls.

### Modified Capabilities

- `workflow-variable-config`: Extractor and Setter type controls should keep their compact icon presentation while using native select interaction.
- `workflow-evaluator-node`: Evaluator operand type controls should keep their compact icon presentation while using native select interaction and existing allowed-type filtering.

## Impact

- Affected code: `packages/flow/src/workflow/components/workflow-type-picker`, Extractor and Setter node components, Evaluator operand editor, and related tests.
- Affected UI dependency: reuse the existing `@workspace/ui/components/native-select` component rather than introducing a new package.
- No API, persistence, runtime export, or backend contract changes are expected.
