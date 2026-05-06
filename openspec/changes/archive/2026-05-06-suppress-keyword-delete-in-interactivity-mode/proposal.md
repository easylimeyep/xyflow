## Why

The workflow canvas exposes a "Toggle interactivity" control through React Flow controls. When interactivity is disabled, users expect nodes to behave as non-editable canvas objects: hover-only editing affordances should not appear and should not remain clickable.

Keyword nodes currently still reveal the token-row delete button on hover in this mode. That makes the node look editable and allows token removal even though the canvas is in a non-interactive state.

## What Changes

- Suppress the Keyword token-row delete affordance while workflow interactivity is disabled.
- Prevent token deletion from the hover delete button in the disabled-interactivity mode.
- Preserve existing Keyword token add/remove/edit behavior when workflow interactivity is enabled.
- Keep the empty visual row behavior unchanged when a Keyword has no stored tokens.
- Add focused tests for delete affordance visibility and deletion behavior across interactive and non-interactive states.

## Capabilities

### Modified Capabilities

- `keyword-tagged-input`: Keyword token-row deletion should only be available while workflow node interactivity is enabled.

## Impact

- Affects `packages/flow/src/workflow/nodes/data/inline-expression/keyword-expression-list-input.tsx`.
- May affect `packages/flow/src/workflow/nodes/data/inline-expression/component.tsx` if the interactivity state needs to be passed into the Keyword input.
- May affect Keyword node tests in `packages/flow/src/workflow/nodes/data/inline-expression/component.test.tsx`.
- Does not change token validation, persistence shape, repeatable/root toggles, graph state, edge behavior, layout, or import/export DTOs.
