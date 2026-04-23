## Why

The branch node currently uses custom select popovers for condition operators and the AND/OR combiner, while the result node already uses the shared native select component. Aligning branch with result reduces interaction complexity inside draggable node content and makes select behavior more predictable across the workflow editor.

## What Changes

- Replace the branch condition operator custom select with the shared `NativeSelect` and `NativeSelectOption` components.
- Replace the interactive branch logical operator custom select with the shared native select component.
- Preserve the existing branch operator catalog behavior: stored values remain operator ids, labels remain runtime-provided operator values, missing stored operators remain selectable as fallback options, and target input visibility continues to derive from `requiresTarget`.
- Update branch node styles and tests to cover native select interactions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workflow-branch-operator-options`: clarify that branch operator selection is rendered through native select controls while preserving the existing operator id/value contract.

## Impact

- Affected code: `packages/flow/src/workflow/nodes/logic/branch-node.tsx`, `packages/flow/src/styles/components/nodes/branch-node.styles.ts`, and `packages/flow/src/workflow/nodes/logic/branch-node.test.tsx`.
- Affected UI: branch condition operator select and the first editable AND/OR combiner between conditions.
- APIs, runtime exports, node config shape, and dependencies are unchanged.
