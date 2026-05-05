## Why

Large workflow graphs can produce long shortcut edges that visually pass through or underneath intermediate nodes, making branch outcomes hard to read. The current ELK integration positions nodes but discards ELK edge routing output, so React Flow falls back to Bezier paths that do not know about node obstacles.

## What Changes

- Preserve ELK-routed edge geometry from auto-layout results.
- Render routed workflow edges from ELK route points when available.
- Keep Bezier rendering as a fallback for manually created or non-layouted edges.
- Add routing-oriented ELK options so workflow diagrams prefer readable orthogonal paths with edge-to-node spacing.
- Add tests for route persistence, routed edge rendering, fallback behavior, and the large branch shortcut case.

## Capabilities

### New Capabilities

- `workflow-elk-edge-routing`: Defines route-aware ELK auto-layout behavior for workflow edges, including how routed paths are stored and rendered.

### Modified Capabilities

- `workflow-initial-graph-builders`: Initial ELK graph creation should return route-aware edges when ELK provides edge sections.

## Impact

- Affects `packages/flow/src/workflow/layout/*`, especially the ELK graph adapter and auto-layout result application.
- Affects `packages/flow/src/workflow/components/workflow-edge/workflow-edge.tsx` so edges can render either ELK-routed paths or the existing Bezier fallback.
- Affects workflow edge data typing and any DTO/import-export path that must preserve or intentionally omit ephemeral route metadata.
- Does not add a new layout dependency; ELK remains the layout engine.
