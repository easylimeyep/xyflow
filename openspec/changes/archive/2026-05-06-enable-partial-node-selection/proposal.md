## Why

Workflow node box selection currently requires a node to be fully enclosed by the selection rectangle before it becomes selected. This makes multi-select feel overly precise, especially for larger nodes or dense workflows where users naturally drag a rectangle across the relevant area rather than around every node boundary.

## What Changes

- Configure the workflow canvas React Flow instance to use partial selection mode for drag selection.
- Keep `selectionOnDrag` enabled so users can continue drawing a selection rectangle without holding a modifier key.
- Select nodes when the selection rectangle partially overlaps them, matching React Flow's built-in `SelectionMode.Partial` behavior.
- Add regression coverage that the workflow canvas passes partial selection mode to React Flow.

## Capabilities

### New Capabilities
- `workflow-canvas-selection`: Defines workflow canvas drag-selection behavior for selecting nodes by partial overlap.

### Modified Capabilities

## Impact

- `packages/flow/src/workflow/components/workflow-canvas/workflow-canvas.tsx`: Configure React Flow selection mode.
- `packages/flow/src/workflow/components/workflow-canvas/workflow-canvas.test.tsx`: Verify the selection mode prop is wired.
- No new runtime dependencies are expected; this should use the existing `@xyflow/react` API.
