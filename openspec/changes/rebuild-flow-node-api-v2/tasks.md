## 1. Node API v2 Runtime Foundation

- [x] 1.1 Define Node API v2 TypeScript contracts for schema/defaults, component binding, ports, rules, and behaviors
- [x] 1.2 Implement Node API v2 registry loader as the single source of truth for node kind metadata
- [x] 1.3 Replace manual node component override maps with definition-driven component resolution
- [x] 1.4 Add runtime contract tests for Node API v2 definition completeness and deterministic lookup

## 2. Graph Engine and Typed Commands

- [ ] 2.1 Create graph-engine command handlers for node CRUD, config updates, connections, and edge insertion
- [ ] 2.2 Introduce typed command payloads for node config updates by node kind and key domain
- [ ] 2.3 Move rename/expression side-effects to behavior-driven graph-engine hooks
- [ ] 2.4 Wire store orchestration to graph-engine handlers while preserving external editor behavior
- [ ] 2.5 Add graph-engine unit tests for deterministic outputs and invalid-command rejection

## 3. Persistence v2 and Config Safety

- [ ] 3.1 Implement schema-driven domain codec for import/export normalization
- [ ] 3.2 Implement schema-driven clipboard codec for copy/paste normalization
- [ ] 3.3 Enforce deterministic handling of invalid payloads and unsupported node kinds
- [ ] 3.4 Add roundtrip regression tests covering setVariable and branch semantic config preservation

## 4. Store Decomposition and Selector Lifecycle

- [ ] 4.1 Recompose store responsibilities around graph-engine boundaries and remove obsolete slice logic
- [ ] 4.2 Implement structural-version based expression cache lifecycle in store state
- [ ] 4.3 Ensure expression selector returns stable cached references for unchanged structural inputs
- [ ] 4.4 Add store tests for cache invalidation rules and cross-store isolation

## 5. Performance Guardrails

- [ ] 5.1 Isolate pointer tracking from non-canvas render paths and add frame-safe update throttling
- [ ] 5.2 Preserve drag/pan interaction history semantics without excessive recomputation
- [ ] 5.3 Add/refresh render-budget tests for viewport and pointer-heavy interaction flows
- [ ] 5.4 Validate interaction latency and FPS behavior on representative graph sizes

## 6. Cleanup and Quality Gates

- [ ] 6.1 Remove deprecated internal contracts, legacy runtime/store modules, and stale node-type definitions
- [ ] 6.2 Update integration tests for editor behavior parity after clean cutover
- [ ] 6.3 Raise coverage thresholds to production target and make CI fail on threshold breaches
- [ ] 6.4 Run full lint/typecheck/test/coverage gates and document final verification evidence
