# packages/flow baseline audit

Date: 2026-03-30

## Architecture baseline (SOLID view)

- `node-registry` is a single dependency hub that mixes:
  - UI metadata (`icon`, `title`, `fields`);
  - graph constraints (`allowedTargets`, `outputPaths`);
  - data normalization (`normalizeNodeConfig` / `coerceFieldValue`);
  - node creation (`createWorkflowNode`).
- `graph-slice` orchestrates graph updates, history policy, validation flows, and
  node-specific behavior (`setVariable` rename/refactor branch) in one module.
- config writes are weakly typed at boundary level:
  - `updateNodeConfigField(nodeId, key: string, rawValue)` allows arbitrary keys;
  - dynamic assignment `[key]` in runtime path.

## Scale and extension risks

- Adding a new node kind requires synchronized edits in multiple locations:
  - `types.ts` (`NodeKind`, `NodeConfigByKind`, kind guards);
  - `node-registry.ts` definition;
  - `nodes/node-types.tsx` component map;
  - any edge/validation or mapper assumptions.
- `select` config values are only type-coerced to `string`, not validated against
  field option values, allowing invalid persisted config states.
- `WorkflowStoreState` exposes a wide flat command/query surface that couples
  presentation layer to full store API.

## Performance constraints to preserve

- Pointer-only and viewport-only updates must not rerender non-canvas containers.
- Expression variable selector should preserve references when graph inputs are
  unchanged.
- Node-change routing should avoid frequent callback identity churn in large graphs.

See: `docs/architecture/perf-budget.md`.

## Critical behavior scenarios to protect

- node drag is transient and commits history only on drag end;
- edge insertion can split an edge into two edges and fallback to single-edge path;
- quick-add and edge-insert clear pending state and keep selection consistent;
- clipboard copy/paste preserves internal links and unique label/variable naming;
- viewport updates do not create history entries;
- set-variable rename updates expression references and enforces uniqueness.

## Immediate refactor goals

1. Split `node-registry` into focused modules (metadata, graph rules, normalization).
2. Introduce a typed config update boundary for node config writes.
3. Move node-kind specific config side-effects out of `graph-slice`.
4. Expand regression and performance guardrail tests around extracted pure logic.
