## 1. Backend Export Mapper Tests

- [x] 1.1 Add tests for `exportDraftDomainWorkflowForBackend` preserving workflow fields and node semantic fields.
- [x] 1.2 Add tests for draft export of graphs without roots, with unreachable nodes, and with cycles.
- [x] 1.3 Add tests for deterministic draft ordering and numeric link remapping across repeated exports.
- [x] 1.4 Add tests for draft evaluator branch mapping and missing branch `null` values.
- [x] 1.5 Add tests that draft export rejects connections with unknown source or target node IDs.

## 2. Draft Backend Export Implementation

- [x] 2.1 Refactor backend export internals to share graph indexing, sorted outgoing connections, backend id assignment, and node mapping between strict and draft exports.
- [x] 2.2 Implement draft order resolution that allows incomplete workflow readiness and appends remaining nodes deterministically.
- [x] 2.3 Add `exportDraftDomainWorkflowForBackend(dto: DomainWorkflowDTO): BackendWorkflowDTO`.
- [x] 2.4 Preserve existing `exportDomainWorkflowForBackend` strict behavior and error paths.

## 3. Public API Exports

- [x] 3.1 Export `exportDraftDomainWorkflowForBackend` from `packages/flow/src/workflow/mappers/backend-export/index.ts`.
- [x] 3.2 Export `exportDraftDomainWorkflowForBackend` from `packages/flow/src/workflow/mappers/index.ts`.
- [x] 3.3 Export `exportDraftDomainWorkflowForBackend` from `packages/flow/src/index.tsx`.

## 4. Evaluator Connection Validation

- [x] 4.1 Add validation tests rejecting a second outgoing connection from the same evaluator `evaluator-true` handle.
- [x] 4.2 Add validation tests rejecting a second outgoing connection from the same evaluator `evaluator-false` handle.
- [x] 4.3 Add validation coverage confirming an existing true branch still allows a false branch when other rules pass.
- [x] 4.4 Update `validateConnection` to enforce one outgoing connection per evaluator source handle.

## 5. Verification

- [x] 5.1 Run the focused flow mapper and validation test suites.
- [x] 5.2 Run the package-level tests or the repository's relevant verification command for `packages/flow`.
- [x] 5.3 Review the final diff to confirm strict backend export behavior was not relaxed.
