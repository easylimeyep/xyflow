## 1. Builder Foundations

- [x] 1.1 Create an initial-graph builder module under `packages/flow/src/workflow/` with compact input types for semantic node and edge authoring.
- [x] 1.2 Implement normalization helpers that resolve node defaults from the registry, merge partial config over definition defaults, derive node `type`, fill edge metadata, and apply default document/viewport values.
- [x] 1.3 Add validation or guardrails for invalid edge references so builders fail clearly when nodes are missing.

## 2. Layout Modes

- [x] 2.1 Implement the synchronous `createInitialGraph()` path using deterministic left-to-right DAG layering with stable per-layer ordering.
- [x] 2.2 Reuse workflow layout-port metadata so linear branch ordering follows node-definition output handle order.
- [x] 2.3 Implement the asynchronous `createInitialGraphElk()` path as a wrapper over `computeWorkflowAutoLayout()` using the normalized graph state.

## 3. Public API and Coverage

- [x] 3.1 Export the new builder functions and their public input types from the `@workspace/flow` package root.
- [x] 3.2 Add unit tests for normalization defaults, linear layout determinism, branch ordering, and ELK builder graph preservation.
- [x] 3.3 Update the demo in `apps/web/app/page.tsx` to replace the hand-authored `initialGraph` example with builder-based usage for the new API.
