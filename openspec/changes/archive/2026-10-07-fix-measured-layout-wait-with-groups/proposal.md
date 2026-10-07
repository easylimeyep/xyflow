## Why

With `autoLayoutOnInit="after-measure"`, a workflow that contains a node group never leaves the "Preparing measured layout..." overlay, so the host cannot use the editor at all. The wait is gated on React Flow's `useNodesInitialized`, which requires `measured` on every node passed to `<ReactFlow>` — including the derived `groupFrame` / `groupCard` nodes, which never receive `measured` because the canvas builds them from groups and drops their dimension changes. A host integrating `@flow/flow` with grouped workflows hit this.

## What Changes

- The measured initial auto-layout waits only for the rendered **workflow nodes** to report dimensions. Derived group nodes (expanded frames and collapsed cards) no longer take part in the wait.
- Two hanging cases are fixed:
  - a graph with an expanded group (its frame is never measured);
  - a graph whose every node sits inside collapsed groups (only the cards are visible and they are never measured).
- A second hang found while fixing the above is fixed too: when nothing has to be measured at mount (for example, every node is inside a collapsed group), the layout starts on mount, and if the canvas re-runs its initialization before the layout finishes (React StrictMode in development, or any input change), the finished layout is discarded and the loader never clears. The loader now clears whenever the layout settles while the canvas is mounted.
- No timeout or fallback is added: if a workflow node never reports its size, the loader still waits, as today.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `workflow-auto-layout`: the "Measured initial auto-layout waits for node dimensions" requirement states explicitly that derived group nodes are not waited on, and gains scenarios for a graph with an expanded group, for a graph whose nodes are all hidden in collapsed groups, and for a graph that is already measured at mount.

## Impact

- `packages/flow/src/workflow/components/workflow-canvas/workflow-canvas.tsx`: the initial-layout wait drops `useNodesInitialized` and relies on the existing `allNodesMeasured` check over visible workflow nodes; the settled layout clears the loader based on whether the canvas is still mounted, not on whether the effect that started it was cleaned up.
- Tests in `packages/flow` covering measured initial layout with groups, exercising React Flow's real initialization instead of a mocked `useNodesInitialized`.
- No public API, store, persistence, or dependency changes.
