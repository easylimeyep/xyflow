## 1. Public API

- [x] 1.1 Add `autoLayoutOnInit?: "after-measure"` to `WorkflowEditorProps` and thread it through the default and compound editor composition.
- [x] 1.2 Preserve existing behavior when `autoLayoutOnInit` is omitted, including custom `WorkflowEditor` children.
- [x] 1.3 Update package exports or public type tests if needed so the new prop is visible from `@workspace/flow`.

## 2. Store Bootstrap Layout

- [x] 2.1 Add a store action for measured initial layout that calls `computeWorkflowAutoLayout` using the current measured graph.
- [x] 2.2 Apply the bootstrap layout by replacing `history.present` without pushing the provisional graph into `history.past`.
- [x] 2.3 Ensure bootstrap layout failures preserve current graph state, set the existing auto-layout error, and report failure to the caller.
- [x] 2.4 Guard the bootstrap action so one mounted editor does not run measured initial layout more than once.

## 3. Canvas Measurement And Loader

- [x] 3.1 Detect when all initial nodes are measured using React Flow's node initialization signal or the existing dimensions updates.
- [x] 3.2 Add an initializing/loading state that keeps measured nodes mounted while preventing the provisional arrangement from being visible or interactive.
- [x] 3.3 Trigger the bootstrap layout after measurements are ready, then fit the viewport with the standard ELK padding and zoom bounds.
- [x] 3.4 Treat empty graphs as initialized without waiting for measurement.
- [x] 3.5 Clear the loading state after layout success or failure.

## 4. Examples

- [x] 4.1 Update the large ELK graph example to pass `autoLayoutOnInit="after-measure"` and avoid precomputing the graph with `createInitialGraphElk` when measured layout is desired.
- [x] 4.2 Keep the existing `createInitialGraphElk` examples available for non-measured initial layout behavior.
- [x] 4.3 Adjust example copy/code snippets to distinguish DOM-measured editor layout from utility-level ELK graph construction.

## 5. Verification

- [x] 5.1 Add store tests proving measured initial layout replaces present state without creating undo history.
- [x] 5.2 Add editor/canvas tests for the loader, measurement-ready trigger, viewport fit, and failure reveal behavior.
- [x] 5.3 Add public API tests for omitted `autoLayoutOnInit` and `autoLayoutOnInit="after-measure"`.
- [x] 5.4 Run `pnpm --filter @workspace/flow test` and relevant web/example checks.
