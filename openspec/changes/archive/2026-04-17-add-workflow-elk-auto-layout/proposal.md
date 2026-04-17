## Why

The workflow editor currently relies on manual positioning and incremental placement helpers, which makes larger graphs drift into uneven layouts after repeated edits. Adding a manual auto-layout action gives users a fast way to reorganize the full workflow into a readable left-to-right structure without rebuilding the graph by hand.

## What Changes

- Add a manual auto-layout action to the workflow canvas controls alongside the existing React Flow zoom controls
- Compute workflow node positions with an ELKjs-powered layout pass that arranges the current graph into a readable left-to-right flow
- Preserve workflow semantics by applying auto-layout as a single graph history step so one undo reverts the full layout operation
- Reframe the viewport after a successful layout so the reorganized graph is immediately visible
- Keep the feature manual-only in the first version; node creation, connect, drag, and quick-add flows remain unchanged until the user explicitly triggers auto-layout

## Capabilities

### New Capabilities

- `workflow-auto-layout`: Manual workflow graph auto-layout that repositions the current canvas into a readable structure and integrates cleanly with history and viewport behavior

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- `packages/flow/src/workflow/components/workflow-canvas/` — add a custom controls button and success flow for viewport refitting
- `packages/flow/src/workflow/store/` — introduce a layout command that computes and commits graph-wide position updates as one semantic history entry
- `packages/flow/src/workflow/` — add ELKjs layout adapter/helpers for translating workflow nodes, edges, and handles into ELK graph input
- `packages/flow/package.json` — add the `elkjs` dependency
- Workflow editor tests will need new coverage for manual layout triggering, history behavior, and viewport updates
