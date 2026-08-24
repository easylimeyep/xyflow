## Why

The workflow canvas today only supports authoring. A consuming product needs to show a workflow
while it is running — which nodes finished, which one is active, which branch was skipped, how far a
loop node has progressed — without letting the viewer mutate the graph.

Today that is impossible: the canvas has a single editing mode, `NodeShell` carries no runtime
state, and edges have no traversal styling. The consumer would otherwise reimplement a second canvas
just to display progress.

Runtime state stays fully external. The package must not know what a "run" is, must not fetch
anything, and must not derive statuses on its own — it renders an overlay it is handed.

## What Changes

- Add an `observe` mode to `WorkflowCanvas` alongside the existing editing behaviour. In this mode
  node dragging, node/edge creation, deletion, and config edits are disabled; pan and zoom stay.
- Add an external `WorkflowRuntimeOverlay` input carrying per-node status, optional loop iteration
  counters, and optional input/output payloads.
- Render node runtime status in `NodeShell` so every node kind — including kinds registered by
  consumers — gets the treatment without per-node work.
- Render iteration counters (`2 / 3`) on nodes whose overlay entry carries one.
- Style edges by traversal state: already traversed, currently active, untouched.
- Replace the config panel with a read-only input/output inspector while in `observe` mode.

## Capabilities

### New Capabilities
- `workflow-runtime-observation`: render an externally supplied runtime overlay on a read-only
  canvas, covering node status, loop iteration counters, edge traversal styling, and the node
  input/output inspector.

### Modified Capabilities
- `workflow-editor-compound-api`: the editor composition accepts a `mode` and an optional `overlay`.
- `workflow-canvas-selection`: selection stays available in `observe` mode, but never leads to a
  mutation affordance.

## Impact

- Affected code: `workflow/components/workflow-canvas`, `workflow/components/workflow-editor`,
  `workflow/components/node-config-panel`, `workflow/nodes/node-shell`,
  `workflow/components/workflow-edge`, and the corresponding `styles/components` modules.
- Affected behaviour: editing behaviour is unchanged when `mode` is omitted — the new mode is
  strictly additive and opt-in.
- API/contract: no DTO or persistence change. The overlay is a view-time input and is never
  serialized into the workflow graph.
- Testing: new unit coverage for overlay rendering and mode gating, plus a Playwright smoke test
  proving the canvas cannot be mutated in `observe` mode.

## Non-goals

- No execution engine. The package does not run workflows and does not compute statuses.
- No change to cycle handling. Cyclic authoring stays permitted per
  `2026-06-23-allow-cyclic-workflows`; consumers that need acyclic graphs enforce that themselves.
- No knowledge of any consumer's domain concepts (runs, sessions, playbooks) inside the package.
