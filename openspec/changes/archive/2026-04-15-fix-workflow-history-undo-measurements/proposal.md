## Why

Workflow undo in the live editor does not reliably remove a newly added node on the first undo. Investigation showed that React Flow mount/layout measurement updates are being recorded as history entries, so undo replays transient UI state instead of the semantic graph change the user expects.

## What Changes

- Refine workflow history commit policy so transient node measurement/layout updates do not create semantic undo steps.
- Preserve runtime node sizing data in the current graph state without polluting undo/redo history.
- Add regression coverage for the real user path: add node, wait for node measurement, undo, and verify the node is removed in one step.
- Audit initial canvas mount behavior so React Flow measurement updates do not seed unexpected history entries before any user action.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `workflow-graph-engine-v2`: interaction history semantics must ignore React Flow measurement/layout-only node updates so undo/redo continues to operate on semantic graph changes.

## Impact

- Affected code in `packages/flow/src/workflow/store/`, `packages/flow/src/workflow/graph-engine/`, and `packages/flow/src/workflow/components/workflow-canvas/`.
- Affected automated coverage in workflow store/editor integration tests.
- No public API changes; behavior change is limited to workflow editor history semantics.
