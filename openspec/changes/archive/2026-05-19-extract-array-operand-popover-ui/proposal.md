## Why

The evaluator node's array operand editor currently mixes workflow-specific state management with reusable popover UI in a single node component. Extracting the reusable UI into `packages/ui` will keep `packages/flow` focused on evaluator behavior and make the array editor easier to reuse and test.

## What Changes

- Move the array operand popover UI into a dumb `@workspace/ui` component that renders a controlled array input popover from plain props.
- Keep evaluator-specific ownership of `open`, draft values, normalization, and commit behavior inside `packages/flow`.
- Replace the inline `ArrayOperandPopover` implementation in the evaluator node with a workflow-aware controlled adapter.
- Preserve the existing evaluator user experience: compact preview chips, overflow badge, placeholder display, row add/delete, and commit-on-close behavior.
- Add or adjust tests so the UI component is covered independently and evaluator behavior remains covered at the workflow layer.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workflow-evaluator-node`: Clarify that evaluator array operand editing is controlled by workflow state while reusable array input popover rendering is provided by the UI package.

## Impact

- Affected code:
  - `packages/flow/src/workflow/nodes/logic/evaluator/component.tsx`
  - `packages/flow/src/styles/components/nodes/evaluator-node.styles.ts`
  - `packages/flow/src/workflow/nodes/logic/evaluator/component.test.tsx`
  - `packages/ui/src/components/*`
- No runtime data model changes.
- No workflow config schema changes.
- No runtime dependency changes; the UI package gains test devDependencies aligned with the existing workspace Vitest setup so the extracted component can be verified independently.
