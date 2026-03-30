# ADR-0004: Node registry boundaries and typed config updates

**Date**: 2026-03-30
**Status**: accepted
**Deciders**: flow package maintainers

## Context

`packages/flow` accumulated coupling around `node-registry` and `graph-slice`.
One module combined UI metadata, graph rules, normalization, and factory logic.
`updateNodeConfigField(nodeId, key: string, value)` also allowed weakly typed writes
to node config and pulled node-specific side-effects into `graph-slice`.

## Decision

Split node registry responsibilities into focused modules and adopt a typed
store command for config updates.
Move node-kind specific config side-effects into `store/node-config-updates.ts`.

## Alternatives Considered

### Alternative 1: Keep monolith registry and add comments
- **Pros**: no migration cost.
- **Cons**: keeps structural coupling and weak boundaries.
- **Why not**: does not reduce regression risk or improve extension flow.

### Alternative 2: Runtime plugin architecture immediately
- **Pros**: maximum extensibility for external node packages.
- **Cons**: high migration scope and API churn.
- **Why not**: too large for current refactor goal; we need incremental hardening first.

## Consequences

### Positive
- Clear boundaries for node metadata, graph policies, normalization, and factory.
- Stronger type contract for config writes (`NodeConfigUpdate` union).
- `graph-slice` becomes thinner by delegating node-config logic.
- Better testability of pure policy modules.

### Negative
- More modules and imports to navigate.
- Some tests and call sites required migration to new update payload shape.

### Risks
- **Risk**: drift between node definition fields and typed update keys.
- **Mitigation**: keep `NodeConfigByKind` as source of truth and add regression tests
  for normalization and config update handlers.
