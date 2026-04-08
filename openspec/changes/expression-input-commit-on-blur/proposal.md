## Why

`ExpressionInput` wrapped in `InlineEditField` has a race condition: when the user types quickly and clicks away, the typed value reverts to the previous committed value after ~200ms. This is caused by a conflict between `InlineEditField`'s two-mode display (draft while focused / storeValue while blurred) and `@uiw/react-codemirror`'s internal typing-protection mechanism (`typingLatch`), which defers external `value` prop changes while the user is actively typing — and accidentally fires a stale closure that overwrites CodeMirror's content with the pre-edit value.

## What Changes

- **`ExpressionInput`** gains internal commit-on-blur/Enter logic: `onChange` is called **once per editing session** (on blur or Enter), not on every keystroke. A `liveValue` internal state is added so validation errors remain live while typing.
- **`InlineEditField` is removed** from all three nodes that wrap `ExpressionInput` with it (`extractor-node`, `set-variable-node`, `inline-expression-node`). Each node wires `ExpressionInput.onChange` directly to `updateNodeConfig`.
- **`branch-node`** changes nothing structurally — it already connects directly — but gains the correct per-session history behavior (was per-keystroke before).
- **`InlineEditField` component and its test** are deleted (no longer used anywhere).

## Capabilities

### New Capabilities

- `expression-input-commit-lifecycle`: ExpressionInput manages its own edit lifecycle — live internal state for validation, deferred commit to the store on blur or Enter, immediate commit on variable insertion.

### Modified Capabilities

_(none — no existing spec-level behavior changes)_

## Impact

- `packages/flow/src/workflow/components/expression-input/expression-input.tsx` — main change
- `packages/flow/src/workflow/nodes/data/extractor/extractor-node.tsx` — remove InlineEditField wrapper
- `packages/flow/src/workflow/nodes/data/set-variable/set-variable-node.tsx` — remove InlineEditField wrapper
- `packages/flow/src/workflow/nodes/data/inline-expression/inline-expression-node.tsx` — remove InlineEditField wrapper
- `packages/flow/src/workflow/nodes/shared/inline-edit-field.tsx` — deleted
- `packages/flow/src/workflow/nodes/shared/inline-edit-field.test.tsx` — deleted
- `packages/flow/src/workflow/nodes/shared/index.ts` — remove InlineEditField export
