## Why

The editor persists workflows as `DomainWorkflowDTO`, where node IDs are stable editor IDs and the `nodes` array order is not guaranteed to match graph execution order.
Backend consumers need a deterministic execution payload with numeric auto-increment IDs, nodes ordered from roots toward terminal nodes, and next-node references embedded directly in each node.

## What Changes

- Add a backend export utility named `exportDomainWorkflowForBackend`.
- Introduce `BackendWorkflowDTO` and `BackendWorkflowNodeDTO` types for the backend-facing payload.
- Derive backend node order from graph topology instead of `DomainWorkflowDTO.nodes` order or visual position alone.
- Remap editor node IDs to numeric IDs assigned by final backend order.
- Encode outgoing links directly on nodes:
  - non-evaluator nodes use `next: number[]`
  - evaluator nodes use `next_true: number | null` and `next_false: number | null`
- Preserve existing node `kind`, `position`, `label`, and `config` fields in backend nodes.
- Validate exportability and fail with explicit errors for invalid graph states.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `workflow-persistence-v2`: add backend workflow export semantics for deterministic topology ordering, numeric ID remapping, and embedded next-node references.

## Impact

- Affected code: workflow mapper layer, workflow DTO types, mapper tests.
- API impact: new exported utility and backend DTO types.
- No changes to existing domain import/export contracts.
- No new dependencies.
