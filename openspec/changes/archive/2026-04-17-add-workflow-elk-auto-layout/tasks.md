## 1. Add ELK layout foundation

- [x] 1.1 Add `elkjs` to `packages/flow/package.json` and create a workflow layout module for ELK-specific helpers.
- [x] 1.2 Implement ELK graph translation helpers that map workflow nodes, dimensions, edges, and handle ids into ELK nodes, ports, and edges.
- [x] 1.3 Define the v1 ELK layered defaults for left-to-right workflow layout, including stable port ordering for named branch outputs.

## 2. Add store-level auto-layout command

- [x] 2.1 Extend the workflow store command surface with an async auto-layout action that reads the present graph and computes next node positions through the ELK adapter.
- [x] 2.2 Commit successful auto-layout results as one semantic history entry while preserving graph identity, connectivity, and selection policy.
- [x] 2.3 Route ELK failures through existing workflow error handling without mutating graph state or seeding undo history.

## 3. Wire the canvas control and viewport behavior

- [x] 3.1 Add a custom auto-layout button to the React Flow controls in `workflow-canvas`.
- [x] 3.2 Trigger the store auto-layout action from the control button and guard against duplicate in-flight runs.
- [x] 3.3 Refit the viewport after a successful auto-layout so the reorganized graph is visible with consistent padding.

## 4. Verify workflow auto-layout behavior

- [x] 4.1 Add layout adapter tests for ELK translation, including multi-handle branch port mapping.
- [x] 4.2 Add store tests covering successful auto-layout, single-step undo/redo, and failure rollback semantics.
- [x] 4.3 Add editor/canvas integration tests covering control-button availability and viewport refit after successful layout.
