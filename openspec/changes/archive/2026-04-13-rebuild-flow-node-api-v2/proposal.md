## Why

The workflow editor currently has inconsistent node authoring APIs, weakly typed config write paths, and persistence edge-cases that can drop node config data. We need a clean internal rewrite now to improve performance and delivery speed while preserving external editor behavior.

## What Changes

- Replace the current node registration and rendering plumbing with a single Node API v2 contract (`defineNode`) that is the source of truth for component binding, schema, graph rules, and node behaviors.
- Replace weak store write contracts with typed editor commands and a graph engine boundary for deterministic state transitions.
- Replace current persistence normalization with schema-driven codecs to prevent config loss during import/export/clipboard roundtrips.
- Replace current selector/cache strategy for expression variables with deterministic memoization keyed by structural versions.
- Introduce explicit performance guardrails for pointer updates, drag/pan interactions, and node-local subscriptions.
- Remove obsolete internal contracts and modules that conflict with Node API v2 and graph-engine boundaries.
- **BREAKING** internal state representation, internal module boundaries, and internal command contracts may change completely.
- External behavior of the workflow editor remains unchanged.

## Capabilities

### New Capabilities
- `workflow-node-api-v2`: Unified and scalable external DX for creating and registering new node kinds.
- `workflow-graph-engine-v2`: Pure graph operation engine with typed command boundaries and invariant enforcement.
- `workflow-persistence-v2`: Schema-driven domain/clipboard codecs that guarantee config-safe roundtrips.
- `workflow-performance-budget-v2`: Enforced interaction/render performance budget for drag/pan and pointer-heavy flows.

### Modified Capabilities
- `store-extensible-node-config`: Move from loosely typed config updates to Node API v2 behavior-driven config updates.
- `store-expression-cache`: Replace non-persistent cache reads with deterministic cache lifecycle and stable selector identity.
- `store-slice-decomposition`: Recompose store around graph-engine boundaries and remove legacy slice responsibilities.

## Impact

- Affected packages: `packages/flow` (primary), `apps/web` integration surface (minimal).
- Affected areas:
  - `workflow/node-registry/**`
  - `workflow/store/**`
  - `workflow/components/**` (node/canvas/editor wiring)
  - `workflow/mappers/**` and persistence codecs
  - `workflow/types/**`
- Test impact:
  - rewrite/add unit tests for node runtime and graph engine
  - update integration and perf guardrail tests
  - raise quality gates to production target coverage.
- Dependency impact: no mandatory external runtime dependencies expected; internal module graph will be redesigned.
