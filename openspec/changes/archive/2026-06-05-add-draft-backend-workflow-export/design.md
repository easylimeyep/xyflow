## Context

`packages/flow` currently exposes `exportDomainWorkflowForBackend(dto)` from the workflow mapper layer. The utility converts a validated domain workflow into backend execution DTO shape by building graph indexes, resolving a strict topological order from root nodes, assigning sequential numeric ids, and embedding outgoing links into backend nodes.

That strict behavior is correct for execution-ready workflows, but backend draft persistence needs to save editor state before the graph is complete. Draft persistence still needs the backend-oriented DTO shape, so duplicating all mapping logic outside the package would create drift.

## Goals / Non-Goals

**Goals:**

- Add `exportDraftDomainWorkflowForBackend(dto)` as a public mapper export.
- Preserve strict `exportDomainWorkflowForBackend(dto)` behavior and validation errors.
- Share backend node mapping logic between strict and draft exports.
- Make draft export deterministic for incomplete graphs.
- Reject structurally broken DTOs with connections that reference missing nodes.
- Prevent evaluator outputs from creating multiple outgoing connections in the editor/store connection validator.

**Non-Goals:**

- Change `BackendWorkflowDTO` or backend node DTO types.
- Change domain import/export JSON shape.
- Make draft exports executable.
- Preserve invalid dangling connections in backend DTO output.

## Decisions

### Keep strict and draft exports as separate functions

The strict function remains the execution-ready export contract. The draft function gets its own name so call sites must choose whether they need execution validation or persistence of partial state.

Alternative considered: add an options parameter to `exportDomainWorkflowForBackend`. This was rejected because it would make a safety-critical validation choice less visible at call sites.

### Share mapping after order resolution

Implementation should split backend export into reusable pieces:

- graph index construction with structural endpoint validation
- strict order resolution for execution export
- draft order resolution for draft export
- backend id assignment and node mapping

This keeps `next`, `next_true`, `next_false`, config preservation, and numeric id remapping consistent between strict and draft exports.

### Draft order is best-effort but deterministic

Draft export should not require roots, root-only entry points, reachability from roots, or acyclic topology. The draft ordering strategy should:

- start with roots sorted by position, label, and id when roots exist
- otherwise seed from nodes with no incoming connections
- process available downstream nodes deterministically when possible
- append any remaining nodes sorted by position, label, and id

This lets empty, disconnected, cyclic, and partially connected graphs export without throwing while ensuring stable numeric ids for the same input.

### Structural endpoint validation remains required

Connections to missing source or target nodes are not a draft-readiness problem; they are a broken DTO. Draft export should keep throwing for unknown endpoints because backend `next` references require numeric ids assigned from existing nodes.

Alternative considered: drop dangling connections silently. This was rejected because it would hide corrupted payloads and produce output that does not explain data loss.

### Evaluator output uniqueness belongs in connection validation

Backend evaluator DTO shape has scalar `next_true` and `next_false` fields, so each evaluator source handle must have at most one outgoing connection. Quick-add already behaves this way, but direct drag connections must be blocked through `validateConnection`.

The strict backend export should keep duplicate evaluator branch validation as a defensive boundary for imported, legacy, or manually constructed DTOs.

## Risks / Trade-offs

- Draft numeric ids can change as the user completes or rewires the graph. Mitigation: treat draft backend DTO ids as export-local references, matching the existing strict export model.
- Draft export may represent cyclic graphs even though backend execution cannot run them. Mitigation: keep strict export as the execution path and document draft export as persistence-only.
- Adding another public export can confuse call sites. Mitigation: use explicit `Draft` naming and cover both strict and draft behavior in tests.
