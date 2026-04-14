## 1. Node API v2 Runtime Foundation

- [x] 1.1 Define Node API v2 TypeScript contracts for schema/defaults, component binding, ports, rules, and behaviors
- [x] 1.2 Implement Node API v2 registry loader as the single source of truth for node kind metadata
- [x] 1.3 Replace manual node component override maps with definition-driven component resolution
- [x] 1.4 Add runtime contract tests for Node API v2 definition completeness and deterministic lookup

## 2. Graph Engine and Typed Commands

- [x] 2.1 Create graph-engine command handlers for node CRUD, config updates, connections, and edge insertion
- [x] 2.2 Introduce typed command payloads for node config updates by node kind and key domain
- [x] 2.3 Move rename/expression side-effects to behavior-driven graph-engine hooks
- [x] 2.4 Wire store orchestration to graph-engine handlers while preserving external editor behavior
- [x] 2.5 Add graph-engine unit tests for deterministic outputs and invalid-command rejection

## 3. Persistence v2 and Config Safety

- [x] 3.1 Implement schema-driven domain codec for import/export normalization
- [x] 3.2 Implement schema-driven clipboard codec for copy/paste normalization
- [x] 3.3 Enforce deterministic handling of invalid payloads and unsupported node kinds
- [x] 3.4 Add roundtrip regression tests covering setVariable and branch semantic config preservation

## 4. Store Decomposition and Selector Lifecycle

- [x] 4.1 Recompose store responsibilities around graph-engine boundaries and remove obsolete slice logic
- [x] 4.2 Implement structural-version based expression cache lifecycle in store state
- [x] 4.3 Ensure expression selector returns stable cached references for unchanged structural inputs
- [x] 4.4 Add store tests for cache invalidation rules and cross-store isolation

## 5. Performance Guardrails

- [x] 5.1 Isolate pointer tracking from non-canvas render paths and add frame-safe update throttling
- [x] 5.2 Preserve drag/pan interaction history semantics without excessive recomputation
- [x] 5.3 Add/refresh render-budget tests for viewport and pointer-heavy interaction flows
- [x] 5.4 Validate interaction latency and FPS behavior on representative graph sizes

## 6. Cleanup and Quality Gates

- [x] 6.1 Remove deprecated internal contracts, legacy runtime/store modules, and stale node-type definitions
- [x] 6.2 Update integration tests for editor behavior parity after clean cutover
- [x] 6.3 Raise coverage thresholds to production target and make CI fail on threshold breaches
- [x] 6.4 Run full lint/typecheck/test/coverage gates and document final verification evidence

## Verification Evidence

- `pnpm lint` completed successfully via root `turbo lint`; existing warning-only findings remain in `packages/store`, `packages/flow`, `packages/ui`, and `apps/web`.
- `pnpm typecheck` completed successfully via root `turbo typecheck`.
- `pnpm test` completed successfully via root `turbo test`:
  - `@workspace/store`: 20/20 tests passed
  - `@workspace/flow`: 197/197 tests passed
- `pnpm test:coverage` completed successfully via root `turbo test:coverage`:
  - `@workspace/store`: 100% statements / branches / functions / lines
  - `@workspace/flow`: 83.00% statements, 72.46% branches, 84.21% functions, 84.18% lines
- `packages/flow` coverage thresholds raised to 80% statements / 70% branches / 80% functions / 80% lines and enforced by Vitest.
