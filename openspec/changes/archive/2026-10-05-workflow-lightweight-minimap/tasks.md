# Tasks

## 1. Dependency

- [x] 1.1 Add `@xyflow/system` at exactly `0.0.75` (the version `@xyflow/react@12.10.1` resolves) to `packages/flow/package.json` and run `pnpm install`; verify `pnpm why @xyflow/system` in `packages/flow` lists a single version

## 2. Path building (pure helpers)

- [x] 2.1 Add `components/workflow-minimap/minimap-geometry.ts` with a pure function that turns internal nodes (absolute position + measured size) into `{ nodesD, framesD, bounds }`: rounded-rect subpaths, hidden and unmeasured nodes skipped, frame nodes picked by a single `isMiniMapFrame` predicate; verify with unit tests for an empty graph, hidden nodes, unmeasured nodes, a frame separated from regular nodes, and bounds that cover every drawn node
- [x] 2.2 Add the view helper: the framing of the union of node bounds and the viewport (scaled to the element box, centered, padded with `offsetScale * viewScale` like React Flow's `MiniMap`), the framing of the nodes alone, the node-layer transform that maps one into the other, the viewport frame box with the border straddling the edge, and the pointer-to-flow mapping; verify with unit tests comparing the framing against React Flow's formula, the transform mapping a node corner to the same pixel as the view frame, the frame box, the click mapping, and the empty-graph case

## 3. Minimap component

- [x] 3.1 Add `workflowMiniMapStyles` (`tv`) under `styles/components/canvas/` with slots for the panel, the surface, the node layer, the svg, nodes, frames and the viewport frame (`var(--primary)` 2px border, mask-colored shadow); verify typecheck passes and the classes keep `react-flow__minimap`, `react-flow__minimap-svg` and `react-flow__minimap-node`
- [x] 3.2 Implement `WorkflowMiniMap` with the geometry selector cached on `s.nodes`, the node layer rendered at the nodes-only framing, and a `store.subscribe` that writes the node-layer and viewport-frame transforms without a React render; verify with a component test on a real `ReactFlowProvider` store that a transform update neither rebuilds the geometry nor re-renders the node layer, and writes new transforms to both layers, and that a node change does re-render the node layer
- [x] 3.3 Verify with a component test that a dimension change from React Flow, applied through the controlled `nodes`, updates the node path (guards the "stale `nodeLookup`" risk in design.md)
- [x] 3.4 Attach `XYMinimap` to the surface element once `panZoom` exists (`pannable: true`, `zoomable: false`, extent and size from the store) and destroy it on unmount; map clicks to flow positions with the view helper and pass them to an `onClick(event, position)` prop; verify with a component test with `@xyflow/system` mocked that `update` receives `pannable: true, zoomable: false`, `destroy` runs on unmount, and a click calls `onClick` with the position the helper computes
- [x] 3.5 Verify with a component test that the viewport frame carries the primary 2px border class and follows the viewport size and position

## 4. Canvas integration

- [x] 4.1 Replace `<MiniMap>` in `workflow-canvas.tsx` with `<WorkflowMiniMap onClick={handleMiniMapClick} />` and drop the `MiniMap` import and the now-unused mask stroke constant if it moved; verify that the `workflow-canvas` tests pass after moving the minimap mock and its prop assertions (pannable, zoomable, mask stroke) to the new component, while the click-centering assertions stay in the canvas tests
- [x] 4.2 Verify the existing "rounded and clipped" style test still passes unchanged (`.react-flow__minimap` rules in `style.css`)

## 5. Integration checks

- [x] 5.1 In the 509-node story, verify in the browser that drag panning in the minimap moves the canvas, the wheel over the minimap does not zoom, a click centers at the current zoom without selecting a node, and the viewport bounds follow panning; compare screenshots with the old minimap in light and dark themes
- [x] 5.2 Re-run the pan trace (headed, zoom 0.1 and 0.9, minimap shown vs hidden, calm machine) and record the results in design.md; verify that the minimap adds no paint events while panning and that its main-thread overhead stays within run-to-run noise
- [x] 5.3 Run `pnpm lint`, `pnpm typecheck` and `pnpm test` in `packages/flow`; verify they all pass and coverage stays above the 70% threshold
