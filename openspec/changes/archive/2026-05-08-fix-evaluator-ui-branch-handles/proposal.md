## Why

The workflow editor can currently create an invalid evaluator graph state through UI interactions.
When an evaluator node is inserted on an existing edge, the split preserves the original edge's source handle on the upstream leg, but creates the inserted evaluator's downstream leg with `sourceHandle: null`.

That graph renders as if the inserted evaluator is connected to the downstream node, but backend export rejects it because evaluator outputs are branch outputs and must use `evaluator-true` or `evaluator-false`.
The same mismatch also leaves the evaluator's true quick-add affordance visible because the UI only hides a branch `+` when an outgoing edge exists for that exact branch handle.

## What Changes

- Enforce evaluator source handle validity during editor connection validation.
- Ensure evaluator outgoing edges created by UI flows always use `evaluator-true` or `evaluator-false`.
- Update edge insertion so inserting an evaluator on an existing edge connects the downstream continuation through a valid evaluator branch.
- Keep the non-selected evaluator branch available for quick-add.
- Add regression coverage for manual connections, quick-add visibility, and edge insertion.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `workflow-evaluator-node`: require UI-created evaluator outgoing connections to use named evaluator branch handles and keep branch quick-add affordances synchronized with stored edge handles.

## Impact

- Affected code: workflow connection validation, edge insertion, quick-add affordance behavior, graph/store tests, canvas/component tests.
- API impact: none.
- Backend export impact: none; exporter validation remains strict and receives fewer invalid editor-created graphs.
- No new dependencies.
