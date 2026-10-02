# Tasks

## 1. Dependency

- [ ] 1.1 Add `@xyflow/system` at exactly `0.0.75` (the version `@xyflow/react@12.10.1` resolves) to `packages/flow/package.json` and run `pnpm install`; verify `pnpm why @xyflow/system` in `packages/flow` lists a single version

## 2. Path building (pure helpers)

- [ ] 2.1 Add `components/workflow-minimap/minimap-geometry.ts` with a pure function that turns internal nodes (absolute position + measured size) into `{ nodesD, framesD, bounds }`: rounded-rect subpaths, hidden and unmeasured nodes skipped, frame nodes picked by a single `isMiniMapFrame` predicate; verify with unit tests for an empty graph, hidden nodes, unmeasured nodes, a frame separated from regular nodes, and bounds that cover every drawn node
- [ ] 2.2 Add the viewBox helper: union of node bounds and the viewport rect, scaled to the element box, centered, and padded with `offsetScale * viewScale` like React Flow's `MiniMap`. Add the viewport mask path (`evenodd` outer box minus the viewport rect); verify with unit tests comparing the viewBox against values computed by React Flow's formula for the same inputs, and with no nodes

## 3. Minimap component

- [ ] 3.1 Add `workflowMiniMapStyles` (`tv`, slots for root, svg, nodes, frames, mask) under `styles/components/canvas/` and export it from the canvas styles index; verify typecheck passes and the classes keep `react-flow__minimap`, `react-flow__minimap-svg`, `react-flow__minimap-node`, `react-flow__minimap-mask`
- [ ] 3.2 Implement `WorkflowMiniMap` with a memoized node layer subscribed only to `s.nodes` and a viewport layer subscribed to `transform`, `width` and `height` (shallow); verify with a component test, using a real `ReactFlowProvider` store, that a transform update re-renders the viewport layer but not the node layer (render counter), and that a node change does re-render the node layer
- [ ] 3.3 Verify with a component test that a dimension change from React Flow, applied through the controlled `nodes`, updates the node path (guards the "stale `nodeLookup`" risk in design.md)
- [ ] 3.4 Attach `XYMinimap` to the svg once `panZoom` exists (`pannable: true`, `zoomable: false`, extent and size from the store) and destroy it on unmount; route svg clicks through `instance.pointer(event)` to an `onClick(event, position)` prop; verify with a component test with `@xyflow/system` mocked that `update` receives `pannable: true, zoomable: false`, `destroy` runs on unmount, and a click calls `onClick` with the pointer position
- [ ] 3.5 Pass the viewport stroke as `var(--primary)` with width 2 through the `--xy-minimap-mask-stroke-*-props` custom properties; verify with a component test that reads the mask element's style

## 4. Canvas integration

- [ ] 4.1 Replace `<MiniMap>` in `workflow-canvas.tsx` with `<WorkflowMiniMap onClick={handleMiniMapClick} />` and drop the `MiniMap` import and the now-unused mask stroke constant if it moved; verify that the `workflow-canvas` tests pass after moving the minimap mock and its prop assertions (pannable, zoomable, mask stroke) to the new component, while the click-centering assertions stay in the canvas tests
- [ ] 4.2 Verify the existing "rounded and clipped" style test still passes unchanged (`.react-flow__minimap` rules in `style.css`)

## 5. Integration checks

- [ ] 5.1 In the 509-node story, verify in the browser that drag panning in the minimap moves the canvas, the wheel over the minimap does not zoom, a click centers at the current zoom without selecting a node, and the viewport bounds follow panning; compare screenshots with the old minimap in light and dark themes
- [ ] 5.2 Re-run the headed pan benchmark (zoom 0.1 and 0.9) from the culling work and record the main-thread time before and after in the change; verify that the time at zoom 0.1 drops at least to the level of the earlier "no minimap" measurement (~700 ms)
- [ ] 5.3 Run `pnpm lint`, `pnpm typecheck` and `pnpm test` in `packages/flow`; verify they all pass and coverage stays above the 70% threshold
