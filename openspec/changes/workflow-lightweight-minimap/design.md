# Design

## Context

See proposal.md (Why) for the per-frame cost this removes. Constraints that shape the approach:

- React Flow keeps nodes, `nodeLookup`, and `transform` in one Zustand store. Every store update calls every subscriber's selector. Subscribing to fewer slices is not possible; the only lever is how many selectors exist and how cheap each one is.
- `nodeLookup` is a `Map` that React Flow mutates in place, so its reference never changes. The `nodes` array reference does change whenever the controlled graph changes: positions, dimensions, selection, add or remove. The workflow store applies React Flow's dimension changes, and `allNodesMeasured` in `workflow-canvas.tsx` already relies on that.
- `@xyflow/system@0.0.75` exports `XYMinimap({ domNode, panZoom, getTransform, getViewScale })`. It is the d3 drag/zoom handler behind React Flow's `MiniMap`, with `update({ pannable, zoomable, translateExtent, width, height, ... })` and `pointer(event)` for click positions. It also exports `getBoundsOfRects` and `getNodeDimensions`.
- The current styling hooks onto React Flow class names: `.react-flow__minimap` in `packages/flow/src/style.css` (border, `radius-md`, `overflow: hidden`, bottom-left position above the controls), and the `--xy-minimap-*` variables read by `.react-flow__minimap-mask` and `.react-flow__minimap-node` in `@xyflow/react/dist/style.css`.
- In `packages/flow`, class composition goes through `tv` (no `cn`).

## Goals / Non-Goals

**Goals:**
- No mini map work grows with node count during pan or zoom: O(1) selector work per frame and no re-render of the node layer.
- Same look and navigation as today, as defined by the existing `workflow-minimap-navigation` requirements.

**Non-Goals:**
- Per-node colors, per-node click handlers, or highlighting selected nodes. The current mini map has none of these: no `nodeColor`, no `onNodeClick`, and no selected styling.
- Mini map wheel zoom (it stays disabled).
- Speeding up node drag. The node path is rebuilt on every drag frame, the same O(n) React Flow itself already pays.

## Decisions

### 1. Two layers with two subscriptions

```
WorkflowMiniMap (Panel .react-flow__minimap)
  |
  +-- useStore(s => s.nodes)                       ref compare, O(1) per frame
  |     -> useMemo: read nodeLookup for positionAbsolute + measured,
  |        skip hidden / unmeasured, split frames vs nodes,
  |        build two path strings + bounds          O(n), only when nodes change
  |     -> <MiniMapNodeLayer framesD nodesD/>      memo; untouched on pan
  |
  +-- useStore(s => ({ transform, width, height }), shallow)
        -> viewBB, viewBox = union(bounds, viewBB) + offset
        -> <svg viewBox> + <path class="react-flow__minimap-mask" evenodd>
```

The viewBox is computed the same way as React Flow's `MiniMap`: scale the union to the element box, center it, add `offsetScale * viewScale` padding. Mini map framing therefore stays identical.

*Alternative:* keep `MiniMap` and pass a custom `nodeComponent`. Rejected: the cost is in `MiniMap`'s own per-node subscriptions and its root selector, and `nodeComponent` cannot remove them.

*Alternative:* one selector returning the node path and the viewBox together. Rejected: the viewport part changes every frame, so the node path would be recomputed or at least compared every frame.

### 2. All nodes in one `<path>`, frames in a second one

Each node becomes a closed rounded-rect subpath (`M x+r y h … a r r 0 0 1 … Z`) appended to one `d` string. The rounded corners match the 5px default radius of React Flow's mini map nodes, scaled like React Flow's. The path keeps the `react-flow__minimap-node` class, so `--xy-minimap-node-*` theming still applies.

Group frames (nodes of the frame type from `workflow-node-groups`, recognized by one predicate) go into a second path rendered first, with its own `tv` slot. It is filled with a muted, semi-transparent fill and a border, so nodes inside a frame stay visible on top of it. Until the groups change lands, the frame path is empty.

*Alternative:* one `<rect>` per node in a memoized list. Rejected: the 509 DOM nodes stay, and that DOM is what costs style and paint.

### 3. Drag panning through `XYMinimap`, added as a direct dependency

`XYMinimap` is attached to the `<svg>` once `panZoom` exists. It is created with `getTransform: () => store.getState().transform` and `getViewScale` read from a ref that is updated each render. It is updated with `pannable: true` and `zoomable: false`, plus `translateExtent`, `width`, and `height` from the store. Clicks go through `instance.pointer(event)` into the canvas's existing `handleMiniMapClick`, which keeps `setCenter` at the current zoom and never selects a node.

`@xyflow/system` is pinned to the exact version `@xyflow/react@12.10.1` resolves (`0.0.75`), so a single copy stays installed. Upgrading `@xyflow/react` means upgrading `@xyflow/system` with it. A comment next to the dependency, or the upgrade checklist, records that.

*Alternative:* hand-written pointer-drag pan via `panZoom.setViewport`. Rejected: it duplicates d3 gesture handling React Flow already ships, and diverges from its feel (inertia, extent clamping).

### 4. Placement and styling

The component renders inside `<ReactFlow>` in place of `<MiniMap>`, wrapped in React Flow's `Panel` with the `react-flow__minimap` class and `position="bottom-left"` semantics. The existing CSS keeps positioning and clipping it. Sizes default to React Flow's 200×150. The mask keeps the `react-flow__minimap-mask` class with `stroke: var(--primary)` and `strokeWidth: 2` passed as the same CSS custom properties React Flow uses (`--xy-minimap-mask-stroke-color-props` and `--xy-minimap-mask-stroke-width-props`), so nothing in `style.css` changes. New styles (the frame slot, the svg) go in a `tv` definition under `styles/components/canvas/`.

The component lives in its own folder (`components/workflow-minimap/`) with an `index.ts`, following the pattern of `workflow-edge` and `selection-toolbar`. The path-building function is a pure helper in that folder, so it can be unit-tested without React.

## Risks / Trade-offs

- [A dimension change reaches `nodeLookup` without a new `nodes` array, so the mini map shows stale sizes] → The workflow store applies every dimension change, which replaces the array. A test renders the mini map, delivers a dimension change, and checks the path. If this ever breaks, add `nodeLookup.size` or a cheap version counter to the selector.
- [`@xyflow/system` version drifts from `@xyflow/react`'s, and two copies get installed] → Exact pin matching the resolved version. Note it in the change's tasks for future upgrades.
- [Visual drift from React Flow's mini map: corner radius, stroke, padding] → The viewBox math and the radius are taken from React Flow's implementation. Compare screenshots before and after in light and dark mode.
- [`workflow-node-groups` lands with a frame representation other than the one assumed] → The frame check is a single predicate. Whichever change lands second updates it. The groups change already lists the mini map in its manual check.
- [jsdom cannot run the d3 gestures] → Unit tests cover path building, the selector boundaries (no node-layer render on a transform update), and click routing with a mocked `XYMinimap`. Drag panning and the visual result are checked in the browser against the 509-node story, using the same pan benchmark as the culling work.

## Migration Plan

This is a single swap inside `WorkflowCanvas` with no data, API, or prop changes. To roll back, revert the commit: the `MiniMap` import and props return as they were.
