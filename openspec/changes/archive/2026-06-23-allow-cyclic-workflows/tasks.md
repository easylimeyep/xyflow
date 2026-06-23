## 1. Validation and Graph Engine

- [x] 1.1 Remove cycle-rejection logic from connection validation while preserving existing non-topology guards (kinds/handles/duplicates/root constraints).
- [x] 1.2 Update graph-engine connect command tests to cover successful cycle-forming connections and unchanged rejection behavior for invalid non-topology cases.
- [x] 1.3 Update store connection flow tests to confirm cyclic connections commit normally and no cycle-specific error is emitted.

## 2. Initial Graph Builder and Layout

- [x] 2.1 Remove synchronous linear initial-layout path and DAG-only topological assumptions from initial graph builder implementation.
- [x] 2.2 Route initial graph creation through ELK-backed positioning flow and keep normalized graph shape unchanged.
- [x] 2.3 Update initial-graph builder tests and fixtures for cyclic inputs and ELK-only placement expectations.

## 3. Backend Export Compatibility

- [x] 3.1 Remove strict-export cycle failure path in backend export mapping while keeping output DTO schema unchanged.
- [x] 3.2 Ensure strict and draft exports preserve cyclic links using existing `next` / `next_true` / `next_false` fields.
- [x] 3.3 Add export tests proving cyclic workflows serialize successfully and documenting that node ordering is not guaranteed topological.

## 4. Documentation and Regression Coverage

- [x] 4.1 Update capability documentation/comments where DAG-only assumptions are stated for validation, export, and initial graph builders.
- [x] 4.2 Add regression tests across validation, builder, and export layers to prevent reintroducing acyclic-only behavior.
- [x] 4.3 Run targeted test suites for modified modules and verify all updated fixtures and snapshots are stable.
