## Context

The workflow editor currently treats the graph as a DAG in several core paths:

- connection validation rejects edges that create cycles;
- strict backend export rejects cyclic graphs;
- initial synchronous graph builder depends on deterministic linear topological layout.

Product direction for this change is to allow any cycle in UI authoring and export while keeping the backend DTO schema shape unchanged. This work is intentionally scoped to UI/state/export serialization behavior only; runtime execution and loop termination policies remain backend concerns.

## Goals / Non-Goals

**Goals:**

- Allow users to create, edit, and persist cyclic graph connections.
- Allow strict export and draft export to serialize cyclic graphs without throwing cycle errors.
- Remove linear initial graph layout path and rely on ELK-backed layout path.
- Preserve current backend DTO shape to avoid schema-breaking changes.

**Non-Goals:**

- Define backend runtime execution semantics for cyclic graphs.
- Add loop termination controls in UI.
- Introduce new loop-specific node kinds or control structures.
- Change node/edge DTO fields or version the schema in this iteration.

## Decisions

### Decision 1: Remove cycle rejection from UI validation

Validation currently uses a cycle-detection guard in connection checks. We will remove this guard so edges are validated only by existing structural rules (known nodes, allowed targets, evaluator handle constraints, duplicate-edge checks, and root incoming constraints).

- Rationale: enabling arbitrary cycles requires first-class authoring support at the editor layer.
- Alternative considered: keep cycle check behind a feature flag. Rejected because product scope explicitly enables cycles unconditionally.

### Decision 2: Keep DTO schema stable while expanding accepted topology

`exportDomainWorkflowForBackend` and `exportDraftDomainWorkflowForBackend` will keep the same output shape (`nodes`, `next`, `next_true`, `next_false`), but strict export will stop failing on cycles. Ordering of `nodes` is treated as stable serialization order, not guaranteed topological order.

- Rationale: preserves API contract shape and minimizes integration migration.
- Alternative considered: introduce export v2 with explicit graph-level metadata. Rejected for this phase because schema stability is a hard requirement.

### Decision 3: Remove linear initial builder semantics

The deterministic linear layout path and DAG-only topological assumptions in initial graph builders will be removed. Initial graph creation will use normalized input plus ELK-backed positioning.

- Rationale: linear placement is DAG-specific and conflicts with arbitrary cycles.
- Alternative considered: preserve linear builder for acyclic-only inputs. Rejected to avoid split behavior and topology-dependent API semantics.

### Decision 4: Treat runtime safety as out-of-scope

No UI-level termination, iteration limits, or execution simulation semantics are introduced in this change.

- Rationale: UI does not execute workflows; backend runtime owns loop safety.
- Alternative considered: add preliminary termination metadata in UI export. Rejected to avoid premature schema/semantic coupling.

## Risks / Trade-offs

- **[Risk] Consumers implicitly expect topological order from strict export** -> **Mitigation**: document that order is serialization order only; add tests for cyclic export stability.
- **[Risk] Removing linear layout may change visual placement for existing acyclic fixture graphs** -> **Mitigation**: update fixture snapshots to ELK-based expectations and verify editor usability.
- **[Risk] Hidden DAG assumptions in tests/utilities** -> **Mitigation**: update validation, export, and initial-graph test suites with explicit cyclic cases.
- **[Risk] Backend runtime not yet cycle-safe** -> **Mitigation**: mark runtime safeguards as explicit dependency outside this UI/export change.

## Migration Plan

1. Remove cycle rejection logic from connection validation.
2. Update graph command and store flows to accept newly valid cyclic connections without error.
3. Remove linear initial layout builder path and route initial graph creation through ELK-based flow.
4. Update strict backend export ordering logic to serialize cyclic graphs without cycle failure.
5. Update and expand tests for validation, initial graph builders, and strict/draft export with cyclic fixtures.
6. Rollout behind normal release process; rollback by restoring previous validation/export checks if needed.

## Open Questions

- Should strict export use deterministic input order, position order, or another stable order when cycles exist?
- Do downstream backend consumers rely on implicit topological ordering today, and if yes, where should adaptation happen?
