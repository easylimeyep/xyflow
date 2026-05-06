## Context

`KeywordExpressionListInput` renders each Keyword token row and conditionally shows a delete button when there is at least one stored token value. The button is styled as a hover affordance, but it is still present in the DOM and clickable when the canvas-level React Flow interactivity toggle is disabled.

React Flow supplies node interactivity state through node props such as `draggable`, `selectable`, `deletable`, and `isConnectable`. The Keyword node can derive whether its editing affordances should be active from those props and pass that state into the token list.

## Goals / Non-Goals

**Goals:**

- Hide the Keyword token-row delete button when workflow interactivity is disabled.
- Ensure clicking cannot remove a Keyword token row while interactivity is disabled.
- Keep the existing delete affordance behavior unchanged when interactivity is enabled.
- Keep the implementation local to the Keyword node/input path.
- Cover the disabled-interactivity case with component tests.

**Non-Goals:**

- Disable all Keyword field editing unless the implementation discovers that this is already the established behavior for the same interactivity state.
- Change how the React Flow control toggles canvas interactivity.
- Change Keyword token validation, array normalization, add-row behavior, or repeatable/root config behavior.
- Introduce new global workflow store state for interactivity.
- Rework node shell hover styling or shared button components.

## Decisions

### Decision: Gate delete affordance from node interactivity props

The Keyword node will derive a local `isInteractive` value from the React Flow node props already provided to `InlineExpressionNode`. The token list will use that value when deciding whether a row can show and execute the delete action.

Alternative considered: read React Flow interactivity state from a separate store or context. The node already receives the effective props that React Flow changes when interactivity is toggled, so adding another state source would increase coupling without improving behavior.

### Decision: Remove the delete button instead of only disabling it

When interactivity is off, the delete affordance should not appear on hover. Not rendering the button matches the requested behavior and avoids accidental click/focus paths.

Alternative considered: render a disabled delete button. That would still reveal the affordance in the disabled-interactivity mode and would keep unnecessary controls in the tab order or accessibility tree unless extra handling is added.

### Decision: Keep enabled-mode behavior unchanged

When interactivity is enabled and the Keyword has one or more stored token rows, the delete affordance should continue to reveal on hover and remove rows exactly as it does today, including collapsing the last stored row to the empty visual state.

## Risks / Trade-offs

- React Flow may expose several props affected by the interactivity toggle. The implementation should pick the prop that best represents node editing availability in this codebase, and tests should model the disabled state explicitly.
- If the delete button was previously present for keyboard users even before hover, removing it in disabled mode changes the accessibility tree only for the intended disabled state.
- If other hover actions exist inside Keyword rows later, they should use the same interactivity gate to avoid inconsistent disabled-mode affordances.

## Migration Plan

1. Extend `KeywordExpressionListInput` with an interactivity prop that defaults to enabled for compatibility.
2. Pass the effective node interactivity state from `InlineExpressionNode` into `KeywordExpressionListInput`.
3. Update row delete rendering so the button is only rendered when the row has stored data and interactivity is enabled.
4. Add tests proving the delete button is hidden and cannot remove rows when the node is non-interactive.
5. Preserve existing tests for enabled delete behavior, final-row collapse, add-row behavior, and validation.

## Open Questions

- Which React Flow node prop in this project most directly reflects the "Toggle interactivity" control for node internals: `draggable`, `selectable`, `deletable`, or a combination? The implementation should verify this against the rendered props/tests before choosing the final gate.
