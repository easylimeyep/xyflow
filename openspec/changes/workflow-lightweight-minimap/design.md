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

### 1. Pan moves only compositor transforms

A first version (one SVG with a `viewBox` and an `evenodd` mask path, both re-rendered by React on each frame) removed the per-node selectors, yet on a pan trace it still doubled the paint events and added about 0.75 ms per pointer move. Its JavaScript was only about 0.08 ms of that. The rest was Blink repainting the whole SVG, including the 509-node path, every time the mask or the `viewBox` changed, plus extra hit testing. So the viewport no longer changes anything that has to be painted:

```
WorkflowMiniMap (Panel .react-flow__minimap)
  |
  +-- useStore(geometry selector)        cached on s.nodes: O(1) per frame,
  |     -> nodesD, framesD, bounds       O(n) rebuild only when nodes change
  |     -> nodes frame = framing of the node bounds alone
  |     -> <div nodes-layer>              own compositing layer
  |          <svg viewBox=nodes frame>    painted only when nodes change
  |            <MiniMapNodeLayer/>
  |
  +-- store.subscribe (no React render)
        -> view = framing of union(bounds, viewport), as React Flow does
        -> nodes-layer.style.transform = translate + scale mapping the
           nodes frame into the view frame          (compositor only)
        -> viewport-frame.style.transform / size     (compositor; size
           changes only when the zoom or the framing scale changes)
```

The viewport rectangle is an HTML element on its own layer: a `border` in `var(--primary)` and a large `box-shadow` spread in the mask color for the dimmed area. The panel's `overflow: hidden` clips the shadow. The border is offset by half its width so it straddles the viewport edge, as an SVG stroke does.

The framing still follows React Flow's `MiniMap`: the union of the nodes and the viewport, scaled to the element box, centered, and padded by `offsetScale * viewScale`. The node layer is rendered at the framing of the nodes alone, and the union framing is always at least as large, so the layer is only ever scaled down. That keeps it sharp.

*Alternative:* the first version (React re-renders the `viewBox` and an SVG mask path). Rejected after measuring, as described above.

*Alternative:* the first version with the nodes moved to a second SVG on its own layer. Measured: no gain, because the `viewBox` of that SVG still changes whenever the union framing changes.

*Alternative:* keep `MiniMap` and pass a custom `nodeComponent`. Rejected: the cost is in `MiniMap`'s own per-node subscriptions and its root selector, and `nodeComponent` cannot remove them.

### 2. All nodes in one `<path>`, frames in a second one

Each node becomes a closed rounded-rect subpath (`M x+r y h … a r r 0 0 1 … Z`) appended to one `d` string. The rounded corners match the 5px default radius of React Flow's mini map nodes, scaled like React Flow's. The path keeps the `react-flow__minimap-node` class, so `--xy-minimap-node-*` theming still applies.

Group frames (nodes of the frame type from `workflow-node-groups`, recognized by one predicate) go into a second path rendered first, with its own `tv` slot. It is filled with a muted, semi-transparent fill and a border, so nodes inside a frame stay visible on top of it. Until the groups change lands, the frame path is empty.

*Alternative:* one `<rect>` per node in a memoized list. Rejected: the 509 DOM nodes stay, and that DOM is what costs style and paint.

### 3. Drag panning through `XYMinimap`, added as a direct dependency

`XYMinimap` is attached to the mini map's surface element once `panZoom` exists. It is created with `getTransform: () => store.getState().transform` and `getViewScale` read from a ref that the per-frame subscription updates. It is updated with `pannable: true` and `zoomable: false`, plus `translateExtent`, `width`, and `height` from the store. With no single SVG `viewBox` left, a click's flow position is computed from the current view frame: the frame origin plus the offset of the pointer within the surface, times flow units per pixel. The click then goes to the canvas's existing `handleMiniMapClick`, which keeps `setCenter` at the current zoom and never selects a node.

`@xyflow/system` is pinned to the exact version `@xyflow/react@12.10.1` resolves (`0.0.75`), so a single copy stays installed. Upgrading `@xyflow/react` means upgrading `@xyflow/system` with it. A comment next to the dependency, or the upgrade checklist, records that.

*Alternative:* hand-written pointer-drag pan via `panZoom.setViewport`. Rejected: it duplicates d3 gesture handling React Flow already ships, and diverges from its feel (inertia, extent clamping).

### 4. Placement and styling

The component renders inside `<ReactFlow>` in place of `<MiniMap>`, wrapped in React Flow's `Panel` with the `react-flow__minimap` class. The existing CSS keeps positioning and clipping it, so nothing in `style.css` changes. Sizes default to React Flow's 200×150. The node path keeps `react-flow__minimap-node`, so `--xy-minimap-node-*` theming applies. The viewport frame takes its dimmed color from `--xy-minimap-mask-background-color`, as React Flow's mask does, and its border from `var(--primary)` at 2px. All classes are composed through a `tv` definition under `styles/components/canvas/`.

The transform math (view frame, node-layer transform, viewport-frame box, pointer-to-flow mapping) is a pure helper in the component folder, so it can be unit-tested without React or a browser.

The component lives in its own folder (`components/workflow-minimap/`) with an `index.ts`, following the pattern of `workflow-edge` and `selection-toolbar`. The path-building function is a pure helper in that folder, so it can be unit-tested without React.

## Risks / Trade-offs

- [A dimension change reaches `nodeLookup` without a new `nodes` array, so the mini map shows stale sizes] → The workflow store applies every dimension change, which replaces the array. A test renders the mini map, delivers a dimension change, and checks the path. If this ever breaks, add `nodeLookup.size` or a cheap version counter to the selector.
- [`@xyflow/system` version drifts from `@xyflow/react`'s, and two copies get installed] → Exact pin matching the resolved version. Note it in the change's tasks for future upgrades.
- [Visual drift from React Flow's mini map: corner radius, stroke, padding] → The framing math and the radius are taken from React Flow's implementation, and the border straddles the viewport edge like an SVG stroke. Compare screenshots before and after in light and dark mode.
- [The node layer is a scaled bitmap while panning at a framing larger than the nodes] → It is only ever scaled down, and it repaints at its own framing whenever the nodes change.
- [Per-frame DOM writes outside React drift from React's render] → The subscription owns only `transform`, `width`, and `height` on two elements React renders without those styles. It re-applies on subscribe and whenever the node frame changes.
- [`workflow-node-groups` lands with a frame representation other than the one assumed] → The frame check is a single predicate. Whichever change lands second updates it. The groups change already lists the mini map in its manual check.
- [jsdom cannot run the d3 gestures or compositing] → Unit tests cover path building and the transform math; component tests cover the selector boundaries (no geometry rebuild or node-layer render on a transform update), the transforms written on a pan, and click routing with a mocked `XYMinimap`. Drag panning and the visual result are checked in the browser against the 509-node story, using the same pan benchmark as the culling work.

## Measurements

Pan trace on the 509-node story: headed Chromium, 4 drag gestures of 60 pointer moves each, renderer main thread, calm machine. Each line compares the minimap shown with the minimap hidden (`display: none`), interleaved, with the first warm-up pair dropped.

| Version | Zoom | Paint events (shown / hidden) | `BeginMainFrame` ms (shown / hidden) |
|---|---|---|---|
| React Flow `MiniMap` (interleaved median task time, 6 runs) | 0.1 | n/a | +190 ms of task time over a gesture set |
| First version (SVG `viewBox` + mask path) | 0.1 | ~750 / 328 | 1549–1640 / 1450–1472 |
| Compositor transforms (this design) | 0.1 | 328 / 328 | 1419–1426 / 1417 |
| Compositor transforms (this design) | 0.9 | 3650 / 3646–3650 | 703–716 / 694–700 |

With this design the minimap adds no paint events while panning, and its main-thread overhead (2–16 ms over 240 pointer moves) is within run-to-run noise.

## Migration Plan

This is a single swap inside `WorkflowCanvas` with no data, API, or prop changes. To roll back, revert the commit: the `MiniMap` import and props return as they were.
