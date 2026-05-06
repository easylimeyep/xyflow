## Why

Large workflow graphs can overlap after initial ELK layout when node content is taller than the layout adapter's fallback estimates. This is visible in the large ELK example where the `Set approval` node contains a long expression and overlaps downstream nodes before React Flow has measured the real DOM height.

## What Changes

- Add a `WorkflowEditor` prop, `autoLayoutOnInit="after-measure"`, that enables a one-time measured initial layout.
- When enabled, the editor mounts the initial graph under a loading state, waits for React Flow node measurements, runs the existing ELK auto-layout pipeline with measured dimensions, applies the resulting positions, fits the viewport, and then reveals the canvas.
- Apply the measured initial layout as editor initialization state, not as a user auto-layout action, so it does not create an undo/redo history entry.
- Keep manual auto-layout behavior unchanged after initialization.
- Keep `createInitialGraphElk` available for non-UI graph construction; measured initial layout is a client/editor capability because it depends on rendered DOM dimensions.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workflow-editor-compound-api`: Add the public `WorkflowEditor` initialization option for measured initial layout.
- `workflow-auto-layout`: Define one-time measured initial layout behavior, loading state, viewport refit, failure behavior, and history semantics.
- `workflow-initial-graph-builders`: Clarify that DOM-measured initial layout is editor-driven and does not replace the existing ELK-backed builder utility.

## Impact

- Affected public API: `WorkflowEditorProps` gains optional `autoLayoutOnInit`.
- Affected editor behavior: default behavior remains unchanged; the new measured layout flow runs only when explicitly requested.
- Affected store/layout internals: add a bootstrap layout action that reuses `computeWorkflowAutoLayout` without committing user history.
- Affected canvas integration: wait for React Flow node measurements and show an initialization loader/overlay until layout completes or fails.
- Dependencies: no new runtime dependencies expected; use existing React Flow measurement APIs and ELK pipeline.
