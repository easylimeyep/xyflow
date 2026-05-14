## Why

Workflow validation results are produced outside the editor and can arrive repeatedly from the server while a user is editing the graph. The editor needs a first-class way to display global workflow errors and node-specific validation feedback without mixing server validation into graph history, node data, export/import, or transient editor operation errors.

## What Changes

- Add a public `validation` input to `WorkflowEditor` for externally supplied validation snapshots.
- Add a validation store layer that keeps server validation separate from graph state, history, undo/redo, clipboard, and export/import.
- Render workflow-level validation messages through an `Alert` surface.
- Render node-level validation messages by marking affected nodes with a destructive visual state and exposing their messages through a compact node UI.
- Optimistically hide stale node validation after local edits to affected nodes, then restore/replace visible validation when a new server validation revision arrives.
- Document examples for polling/query-based integration and stream-based updates that write into a query cache before passing validation to `WorkflowEditor`.

## Capabilities

### New Capabilities

- `workflow-validation-display`: Display externally supplied workflow validation snapshots as global alerts and node-level validation indicators while keeping validation outside persisted graph state.

### Modified Capabilities

- None.

## Impact

- `packages/flow/src/workflow/components/workflow-editor`: public props, validation synchronization, global alert composition.
- `packages/flow/src/workflow/store`: validation state, selectors, and commands for syncing server snapshots and hiding locally stale messages.
- `packages/flow/src/workflow/nodes/node-shell`: node validation visual state and message affordance.
- `packages/flow/src/workflow/nodes/shared`: helper access to node validation state for custom node renderers if needed.
- `packages/flow/src/index.tsx`: exported validation types.
- Tests for store normalization, local hiding behavior, editor rendering, and node visual states.
