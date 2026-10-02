# Proposal

## Why

The workflow canvas uses `MiniMap` from `@xyflow/react`, which costs work on every pan and zoom frame in proportion to the graph size. React Flow keeps nodes and the viewport transform in one Zustand store, so every transform update re-runs every minimap selector. That means one selector per node, a selector that maps all node ids into a new array, and a root selector that walks every node to recompute the bounds and re-renders the minimap. On the 509-node story this is about 15–20% of the main-thread time left while panning, after viewport culling and the hover-only edge toolbar landed on `perf/large-graph-rendering`. The minimap is the largest remaining per-frame cost that grows with node count.

## What Changes

- Replace `MiniMap` from `@xyflow/react` in `WorkflowCanvas` with a workflow-owned minimap. It is used for every graph size, not only for large graphs.
- The node layer subscribes to the node list reference only. It draws every visible node as one SVG path and recomputes that path and the node bounds only when the nodes change, never on a pan or zoom frame.
- Group frames (from the in-flight `workflow-node-groups` change) draw as their own path underneath the regular nodes, so they do not cover the nodes inside them.
- The viewport layer subscribes to the transform and the pane size. It updates only the SVG `viewBox` and the viewport mask path.
- Drag panning reuses `XYMinimap` from `@xyflow/system`, the same d3 handler React Flow's minimap uses. Wheel zoom stays disabled. Click navigation keeps the existing `handleMiniMapClick` (center on the point, keep the zoom, never select a node).
- The minimap keeps React Flow's class names (`react-flow__minimap`, `-svg`, `-mask`, `-node`). Existing theming from `packages/flow/src/style.css` therefore applies unchanged: the `--xy-minimap-*` variables, the `radius-md` clipped container, and the bottom-left position above the controls. The viewport bounds keep the `var(--primary)` stroke at width 2.
- `@xyflow/system` becomes a direct dependency of `packages/flow`, at the version `@xyflow/react` already resolves (`0.0.75`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workflow-minimap-navigation`: adds a requirement that panning and zooming do not recompute or redraw the minimap's node layer, and that the minimap draws group frames beneath their nodes. Existing requirements (click centering, drag panning without wheel zoom, primary viewport stroke, rounded clipped container) stay as they are and must keep passing.

## Impact

- **Code:** `packages/flow/src/workflow/components/workflow-canvas/workflow-canvas.tsx` (swap `MiniMap` for the new component). Adds a new minimap component module under `packages/flow/src/workflow/components/`, its `tv` styles under `packages/flow/src/styles/components/canvas/`, and tests.
- **Tests:** the `MiniMap` mock in `workflow-canvas.test.tsx` and the assertions that read its props (`pannable`, `zoomable`, mask stroke) move to the new component's own tests.
- **Dependencies:** `@xyflow/system@0.0.75` is added to `packages/flow/package.json`. It is already installed transitively, so the lockfile changes only by the direct edge.
- **Coordination:** `workflow-node-groups` lists the minimap in its manual check. Whichever change lands second confirms that group frames render in the minimap's frame layer.
- **No public API change:** `WorkflowCanvas` props are unchanged.
