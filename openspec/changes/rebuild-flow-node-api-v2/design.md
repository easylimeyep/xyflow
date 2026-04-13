## Context

The current workflow editor in `packages/flow` has three core issues that block production readiness at scale:
- node authoring is not single-source-of-truth (definition, rendering, and behavior wiring are split across multiple manual touchpoints);
- config update and persistence paths are not strongly typed end-to-end and can drop config values during normalization roundtrips;
- interaction-sensitive paths (pointer/drag/selectors) rely on patterns that are difficult to reason about under performance budgets.

Constraints and product direction for this change:
- external editor behavior MUST remain stable;
- internal architecture/data representation MAY change completely;
- no migration compatibility is required (clean cutover is acceptable);
- solution must optimize for performance, DX, time-to-market, and stability.

## Goals / Non-Goals

**Goals:**
- Establish Node API v2 as the only authoring contract for node kind registration and behavior.
- Establish a pure graph-engine boundary and typed editor commands.
- Guarantee config-safe import/export/clipboard roundtrips via schema-driven codecs.
- Reduce rerender/latency risk with explicit performance guardrails and selector/cache lifecycle rules.
- Make adding a new node kind require a single cohesive workflow with minimal boilerplate.

**Non-Goals:**
- Introducing new end-user features unrelated to architecture hardening.
- Preserving internal legacy store shape, module boundaries, or command signatures.
- Maintaining backward compatibility for deprecated internal APIs.
- Building a plugin marketplace/runtime-loading system in this change.

## Decisions

### Decision 1: Adopt Node API v2 as single source of truth
- Node definitions SHALL include UI metadata, runtime behaviors, schema/defaults, port topology, and graph rules in one contract.
- Node rendering SHALL resolve directly from `definition.component`.

Alternatives considered:
- Keep current registry + override map split: rejected due to drift risk and repeated integration bugs.
- Build full plugin runtime now: rejected as unnecessary scope for immediate production hardening.

### Decision 2: Introduce graph-engine core with typed commands
- Mutating operations SHALL be implemented as pure graph-engine functions with explicit input/output contracts.
- Store layer SHALL orchestrate command dispatch, history boundaries, and UI state only.

Alternatives considered:
- Keep logic embedded in store slices: rejected due to growing coupling and low test isolation.

### Decision 3: Replace weak config updates with typed patches
- `updateNodeConfig` SHALL be strongly typed by node kind and config key domain.
- Rename/refactor side-effects SHALL be behavior-driven from node definition metadata.

Alternatives considered:
- Keep `kind/key/value` stringly-typed updates: rejected due to runtime-only failure detection.

### Decision 4: Replace normalization with schema-driven codecs
- Domain codec and clipboard codec SHALL validate and normalize through node schemas rather than field-only coercion.
- Unknown/unsupported config values SHALL be handled deterministically according to schema policy.

Alternatives considered:
- Incremental patches around current normalizer: rejected because this preserves ambiguous behavior and data-loss risk.

### Decision 5: Introduce structural-version based cache lifecycle
- Expression variable catalogs SHALL be memoized by structural versions and store instance.
- Selector outputs SHALL preserve stable references when structure is unchanged.

Alternatives considered:
- Ad-hoc map reads without write lifecycle: rejected due to unstable selector identity and avoidable rerenders.

### Decision 6: Enforce interaction performance boundaries
- Pointer updates SHALL be throttled/batched and isolated from non-canvas render paths.
- Drag lifecycle SHALL commit semantic history at drag end while keeping transient updates lightweight.

Alternatives considered:
- Continue immediate store writes per pointer event: rejected due to FPS/latency risk.

### Decision 7: Clean cutover without migration layer
- Legacy internal contracts SHALL be removed during implementation.
- Compatibility adapters are intentionally out of scope.

Alternatives considered:
- Transitional dual architecture: rejected per product direction (no legacy support needed).

## Risks / Trade-offs

- [Risk] Scope concentration in one architectural rewrite could delay delivery if not sequenced. -> Mitigation: execute in bounded vertical slices (runtime, graph-engine, persistence, performance) with hard quality gates.
- [Risk] Regressions in external behavior while internals are replaced. -> Mitigation: lock integration and interaction contracts with regression tests before/after each slice.
- [Risk] Over-designing the node contract could slow everyday development. -> Mitigation: keep Node API v2 minimal, typed, and opinionated; defer plugin-level abstractions.
- [Risk] Performance regressions from incorrect selector subscriptions. -> Mitigation: add explicit render-budget and selector-reference tests as acceptance gates.

## Migration Plan

This change uses a clean cutover strategy (no backward compatibility layer):
1. Build Node API v2 runtime and graph-engine modules behind the existing external editor behavior contract.
2. Move command paths to typed graph-engine operations.
3. Replace persistence and clipboard codecs with schema-driven implementations.
4. Remove legacy internal modules and stale types once parity tests are green.
5. Raise quality gates and finalize as the only architecture path.

Rollback strategy:
- rollback is repository-level revert of the change set; no runtime dual-mode support is planned.

## Open Questions

- Should expression parsing/validation remain in the current module boundaries or move entirely under graph-engine/runtime?
- Do we need an explicit per-node performance budget contract (e.g., max subscription count / max derived-selector cost) in Node API v2?
