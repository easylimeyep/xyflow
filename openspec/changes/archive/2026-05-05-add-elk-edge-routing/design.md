## Context

The workflow editor already uses ELK through `computeWorkflowAutoLayout` and `createInitialGraphElk`. The adapter builds an ELK graph with fixed-order ports and handle-aware edges, then applies only `x` and `y` coordinates back to workflow nodes. Edge geometry returned by ELK is ignored.

React Flow then renders every workflow edge through `WorkflowEdgeComponent`, which computes a Bezier path from source and target coordinates. For dense graphs with long branch shortcut edges, this can draw a connection through the visual area of intermediate nodes even when ELK could provide routed sections.

## Goals / Non-Goals

**Goals:**

- Use ELK as the production layout and routing engine for workflow auto-layout.
- Preserve ELK edge sections in workflow edge data after ELK-backed layout.
- Render routed workflow edges from stored route points when available.
- Keep existing Bezier behavior as a fallback for edges without routed geometry.
- Keep routing metadata compatible with editor interaction, graph import/export, and future layout runs.

**Non-Goals:**

- Replace ELK with Dagre, force layout, or another node layout engine.
- Implement a custom obstacle-avoidance router independent of ELK.
- Make manually dragged nodes continuously re-route edges without an explicit layout pass.
- Change workflow graph semantics, validation rules, or branch condition behavior.

## Decisions

### Decision: ELK owns routed geometry after auto-layout

The ELK adapter will read `layoutedGraph.edges[].sections` and map each usable section into a serializable route model stored on the matching workflow edge. The route model should contain absolute points in React Flow canvas coordinates, including the source point, bend points, and target point.

Alternative considered: only increase node and edge spacing. This improves some layouts but does not guarantee that React Flow's Bezier path avoids nodes because the renderer still ignores obstacles.

Alternative considered: use `react-flow-smart-edge`. This can be useful for interactive rerouting, but it adds a separate router and duplicates the ELK knowledge already present in the layout pipeline.

### Decision: Routed edge rendering is opt-in per edge with Bezier fallback

`WorkflowEdgeComponent` will render a polyline or orthogonal SVG path when the edge data includes a valid route. If no route exists, if the route is malformed, or if an edge is created after layout, the component will keep using the existing Bezier path.

Alternative considered: make routed paths required for all workflow edges. This would make manual graph editing brittle and couple edge rendering to successful ELK execution.

### Decision: Routed path labels use path-length midpoint

The insert/delete toolbar should stay near the visual middle of the rendered edge. For routed paths, the renderer will calculate the midpoint by total segment length rather than averaging endpoint coordinates.

Alternative considered: keep the existing Bezier label coordinates. That would place controls away from the visible routed path for multi-bend edges.

### Decision: Routing metadata is layout-derived and refreshable

Auto-layout should replace stale route metadata for edges returned by ELK and clear invalid route metadata when a route cannot be resolved. Domain export/import should either omit ephemeral route data or preserve it only when the workflow graph type explicitly treats it as presentation state.

Alternative considered: preserve old routes indefinitely. That risks displaying routes that no longer match node positions after edits or failed layout runs.

### Decision: Configure ELK for workflow-style orthogonal routing

The ELK options should explicitly prefer layered, rightward, orthogonal routing with enough edge-node and edge-edge spacing to keep shortcut edges readable. Existing fixed port ordering remains important so `branch-true` and `branch-false` keep stable output semantics.

Alternative considered: spline or polyline routing. Those may look smoother but are harder to visually scan in dense operational workflow diagrams and less aligned with fixed side ports.

## Risks / Trade-offs

- Routed edge metadata increases graph state size -> Store only compact point arrays and avoid duplicating raw ELK payloads.
- ELK may return missing or partial sections for some edges -> Validate each route and fall back to Bezier per edge.
- Orthogonal paths can introduce more bends and visual clutter -> Tune edge-node and edge-edge spacing, and keep the large ELK example as a visual regression target.
- Manual node dragging can stale existing routed paths -> Clear or ignore route metadata on node position edits, or require auto-layout to refresh routes before route rendering.
- DTO persistence could accidentally lock layout artifacts into domain data -> Decide explicitly whether route metadata is editor presentation state and cover mapper behavior with tests.

## Migration Plan

1. Add route metadata typing behind optional edge data fields so existing graphs remain valid.
2. Update ELK layout result application to attach routes when sections are available.
3. Update workflow edge rendering to prefer route metadata with Bezier fallback.
4. Add route-aware tests and verify existing initial graph and store tests still pass.
5. Visually verify the large ELK example, especially `Auto approve? -> result true`, after running auto-layout.

Rollback is straightforward: routed metadata is optional, and the renderer can fall back to the current Bezier path behavior.

## Open Questions

- Should route metadata be persisted in domain import/export DTOs, or treated as transient editor presentation state?
- Should any node move immediately clear all routed edges, only incident routed edges, or leave routes until the next layout?
