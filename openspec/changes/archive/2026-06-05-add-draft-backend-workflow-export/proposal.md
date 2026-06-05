## Why

Backend persistence needs to accept workflow drafts that are not ready for execution, while still receiving the same backend-oriented node mapping shape used by the strict backend export. The current `exportDomainWorkflowForBackend` utility rejects incomplete graphs, which is correct for executable workflows but blocks saving partial editor state through backend APIs.

## What Changes

- Add `exportDraftDomainWorkflowForBackend(dto: DomainWorkflowDTO): BackendWorkflowDTO` for draft persistence.
- Keep `exportDomainWorkflowForBackend` strict and unchanged for execution-ready workflows.
- Reuse the backend export mapping shape: workflow fields, numeric node ids, node semantic fields, regular `next` arrays, and evaluator `next_true` / `next_false` fields.
- Allow draft export for incomplete-but-structurally-valid graphs, including missing roots, root nodes with incoming connections, unreachable nodes, cycles, empty graphs, and missing evaluator branches.
- Preserve structural integrity errors for connections that reference missing source or target nodes.
- Strengthen editor connection validation so an evaluator output handle can have at most one outgoing connection.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workflow-persistence-v2`: Add draft backend workflow export behavior and evaluator output uniqueness requirements.

## Impact

- Affected package: `packages/flow`.
- Public API: export `exportDraftDomainWorkflowForBackend` from workflow mapper entry points and package root exports.
- Tests: backend export mapper tests for draft behavior and validation tests for evaluator output uniqueness.
- No dependency or backend DTO type changes are expected.
