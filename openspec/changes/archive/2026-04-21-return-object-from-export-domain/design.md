## Context

The store export flow currently builds a domain DTO, optionally runs `runtime.exportDomain.mapper`, and immediately serializes the result into JSON text.
This tightly couples domain export with transport formatting, even when callers need direct object access.

## Goals / Non-Goals

**Goals:**
- Make `exportDomain` return a domain object (base or mapped).
- Keep mapper timing and semantics unchanged except for serialization removal.
- Preserve existing UX by serializing only at UI boundaries that require text.
- Update type and tests so the contract is explicit and safe.

**Non-Goals:**
- No changes to import behavior.
- No changes to domain schema shape or mapper invocation order.
- No new runtime config sections.

## Decisions

1. Keep domain DTO construction and runtime mapper inside store `exportDomain`, but remove `JSON.stringify` from store layer.
- Rationale: store remains source of domain transformation truth, while serialization becomes caller concern.
- Alternative considered: add a second API (`exportDomainObject`) and keep existing string API. Rejected to avoid duplicate contracts.

2. Update `exportDomain` return type in store API from `string` to the domain DTO type.
- Rationale: type-level contract prevents accidental string assumptions in consumers.
- Alternative considered: union type (`string | object`). Rejected because it weakens guarantees and complicates consumers.

3. Serialize in UI/export boundary code where text is actually needed.
- Rationale: keeps behavior unchanged for clipboard/text export while unlocking object-first integration paths.

## Risks / Trade-offs

- [Risk] Existing consumers may assume `string` return value and break at compile/runtime. -> Mitigation: update all internal call sites and tests in the same change.
- [Risk] Output formatting differences if different call sites stringify differently. -> Mitigation: keep current `JSON.stringify(value, null, 2)` at text-export boundaries.

## Migration Plan

1. Change store API signature and implementation to object return.
2. Update all internal call sites to stringify only where text is required.
3. Update tests to assert object contract and boundary serialization behavior.
4. Rollback path: restore in-store `JSON.stringify` and string return type if downstream breakage is discovered.

## Open Questions

- None for this scoped change.
