# Tasks

- [x] 1. Move pointer tracking out of the workflow store
  - [x] 1.1 Add an editor-level non-reactive holder for the latest canvas flow pointer position.
  - [x] 1.2 Wire `WorkflowCanvas` pointer movement to update the holder without React state or Zustand writes.
  - [x] 1.3 Remove `lastPointerFlowPosition` and `setLastPointerPosition` from workflow store state/types/slices.
  - [x] 1.4 Remove obsolete store tests that assert pointer-position writes directly.

- [x] 2. Make paste anchoring explicit
  - [x] 2.1 Change `pasteFromClipboard` to accept an optional `XYPosition | null` anchor.
  - [x] 2.2 Use the explicit anchor when provided and keep the viewport fallback when absent.
  - [x] 2.3 Update clipboard hotkey wiring to pass the latest pointer ref value into `pasteFromClipboard`.
  - [x] 2.4 Confirm context-menu, toolbar, and direct API paste callers still work with fallback behavior.

- [x] 3. Add regression coverage
  - [x] 3.1 Add store coverage for explicit paste anchor placement.
  - [x] 3.2 Add store coverage for fallback paste anchor placement when no pointer anchor is supplied.
  - [x] 3.3 Add editor/canvas coverage proving pointer movement does not rerender node components when graph data is unchanged.
  - [x] 3.4 Keep or update existing non-canvas pointer render-budget coverage.

- [x] 4. Verify workflow interaction
  - [x] 4.1 Run focused workflow store and workflow editor tests.
  - [x] 4.2 Run typecheck/lint for affected packages.
  - [x] 4.3 Verify paste-near-cursor behavior in workflow editor coverage.
  - [x] 4.4 Confirm React DevTools no longer shows full node rerenders from plain hover/pointer movement.
