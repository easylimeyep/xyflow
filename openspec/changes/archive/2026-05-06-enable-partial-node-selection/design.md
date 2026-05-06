## Context

The workflow canvas renders `@xyflow/react`'s `ReactFlow` component and already enables rectangle selection through `selectionOnDrag`. Selection updates are emitted by React Flow as `NodeChange` entries with `type: "select"`, then routed through `useNodeChangeRouter` into the workflow store's selection state.

React Flow supports two built-in node selection modes:

- `full`: select only nodes fully contained by the selection rectangle.
- `partial`: select nodes that partially overlap the selection rectangle.

The requested UX is to avoid requiring users to fully enclose every node. This change should lean on React Flow's built-in partial selection behavior instead of adding custom geometry in the workflow store or canvas layer.

## Goals / Non-Goals

**Goals:**
- Enable partial-overlap node selection during workflow canvas rectangle selection.
- Preserve the existing drag-to-select interaction.
- Keep the workflow store's existing selection routing unchanged.
- Add focused regression coverage for the React Flow configuration.

**Non-Goals:**
- Do not implement a custom 50% overlap threshold.
- Do not change click selection behavior.
- Do not change edge selection behavior unless React Flow's built-in mode does so implicitly.
- Do not replace React Flow's built-in selection rectangle implementation.
- Do not change panning, zooming, or mini map interactions.

## Decisions

### Decision: Use React Flow's built-in partial selection mode

Set `selectionMode` on the workflow canvas `ReactFlow` component to React Flow's partial mode. This keeps the behavior aligned with upstream React Flow semantics and avoids duplicating selection-box geometry.

Alternative considered: calculate selected nodes manually using overlap area. This was rejected for this change because the user explicitly chose `selectionMode="partial"` after exploring the stricter 50% threshold idea.

### Decision: Keep selection routing unchanged

Continue using `useNodeChangeRouter` to translate React Flow selection changes into workflow selected node IDs. The selection mode only changes which nodes React Flow marks as selected; the downstream update path should remain the same.

Alternative considered: bypass React Flow selection events and dispatch selected node IDs directly from canvas pointer handlers. This was rejected because it would duplicate behavior React Flow already owns and increase the risk of divergence between visual selection and store selection.

### Decision: Cover configuration at the canvas boundary

Update the existing workflow canvas test mock to expose the `selectionMode` prop and assert that it is partial. This verifies the integration point without re-testing React Flow's internal selection algorithm.

Alternative considered: simulate selection box geometry in jsdom. This was rejected because React Flow's drag-selection behavior depends on its own DOM and viewport internals, while this change only configures a documented React Flow prop.

## Risks / Trade-offs

- [Risk] Partial mode may select nodes even when only a very small sliver overlaps the selection box. -> Mitigation: this is the selected behavior for this proposal; if it feels too aggressive in practice, follow up with a custom threshold change.
- [Risk] React Flow's `SelectionMode.Partial` import path or enum shape could change in future versions. -> Mitigation: keep the usage local to the canvas component and covered by TypeScript/tests.
- [Risk] Tests could become too coupled to a string literal. -> Mitigation: prefer importing React Flow's `SelectionMode` enum in production code while the test only asserts the prop value passed through the mock.
