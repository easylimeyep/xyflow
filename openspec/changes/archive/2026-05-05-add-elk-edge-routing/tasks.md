## 1. Route Data Model

- [x] 1.1 Add optional routed edge presentation data types to workflow edge data.
- [x] 1.2 Decide and implement mapper behavior for route metadata in import/export DTO paths.
- [x] 1.3 Add tests proving route metadata is optional for validation, edge creation, and existing graph state.

## 2. ELK Adapter

- [x] 2.1 Extend ELK layout graph typings to include returned edge sections with start points, bend points, and end points.
- [x] 2.2 Add route extraction from ELK edge sections into compact absolute point arrays.
- [x] 2.3 Apply extracted routes to matching workflow edges during `computeWorkflowAutoLayout`.
- [x] 2.4 Clear or replace stale routed path data when a new layout result is applied.
- [x] 2.5 Add ELK routing and spacing options for orthogonal workflow routes.
- [x] 2.6 Add adapter tests for successful route preservation, missing-section fallback data, and handle-aware branch shortcut routing.

## 3. Edge Rendering

- [x] 3.1 Add a routed path builder that converts route points into an SVG path string.
- [x] 3.2 Add a routed path midpoint utility based on total segment length.
- [x] 3.3 Update `WorkflowEdgeComponent` to render valid routed paths and keep the existing Bezier fallback.
- [x] 3.4 Ensure the visible edge, transparent interaction path, and toolbar placement all use the same routed path geometry.
- [x] 3.5 Add component tests for routed rendering, malformed route fallback, and unchanged Bezier behavior.

## 4. Initial Graph Builder Integration

- [x] 4.1 Verify `createInitialGraphElk` returns routed edge data when ELK provides usable edge sections.
- [x] 4.2 Add or update initial graph builder tests for route-aware ELK output while preserving ids and connectivity.

## 5. Large Graph Verification

- [x] 5.1 Verify the large ELK example renders `Auto approve? -> result true` using an ELK route instead of a direct Bezier curve.
- [x] 5.2 Run package tests for `@workspace/flow`.
- [x] 5.3 Run typecheck and lint for affected packages.
- [x] 5.4 Capture a browser screenshot of the large ELK graph and inspect that shortcut edges do not visually pass through intermediate nodes.
