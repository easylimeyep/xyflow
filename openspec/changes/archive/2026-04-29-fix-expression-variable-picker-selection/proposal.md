## Why

Selecting a variable from an expression picker can close the picker without inserting the variable after the user types `{{}}`. The failure is intermittent because the first click can blur-commit the typed placeholder, remount the expression row, and destroy the picker before the variable selection handler runs.

## What Changes

- Keep expression list rows mounted while their draft value changes so blur commits do not unmount an open picker.
- Preserve variable-picker selection behavior when a click moves focus from CodeMirror into the popover.
- Add regression coverage for selecting a variable from a `KeywordExpressionListInput` row after typing `{{}}`.
- Keep the existing delayed commit contract: typing still does not call `onChange` until blur, Enter, or explicit variable insertion.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `expression-input-commit-lifecycle`: Variable selection must remain reliable when picker interaction causes the editor to blur and parent state updates.

## Impact

- Affected code: `packages/flow/src/workflow/nodes/data/inline-expression/keyword-expression-list-input.tsx`, `packages/flow/src/workflow/components/expression-input/expression-input.tsx`, and expression input/list tests.
- No API, dependency, or data model changes are expected.
