## Context

`DomainWorkflowDTO` is an editor/domain persistence format. It stores graph nodes, graph connections, viewport, and document metadata, but it does not promise that `nodes` are ordered by execution.
This is correct for editing because graph behavior is determined by `connections`, not array position.

The backend-facing format needs a different contract:
- node IDs are numeric and assigned sequentially from `1`
- node array order is execution-oriented
- links to following nodes live inside each node
- evaluator branches are represented as scalar `next_true` and `next_false` values

Because these semantics are specific to backend execution, they should be implemented as a separate adapter rather than replacing `internalToDomain` or `domainToInternal`.

## Goals / Non-Goals

**Goals:**
- Export a validated `DomainWorkflowDTO` into `BackendWorkflowDTO`.
- Use graph topology as the source of execution order.
- Support multiple root nodes in one shared backend node array.
- Support converging branches by emitting shared downstream nodes after all reachable parents are ordered.
- Assign deterministic numeric IDs after final ordering is resolved.
- Preserve `kind`, `position`, `label`, and `config` for every backend node.
- Return clear validation failures for non-exportable workflows.

**Non-Goals:**
- No changes to the existing editor/domain persistence DTO.
- No changes to import behavior.
- No backend execution simulation.
- No auto-repair of invalid graphs during export.
- No UI changes.

## Backend DTO Shape

`BackendWorkflowDTO` will include workflow document fields and backend nodes:

```ts
type BackendWorkflowDTO = {
  id: string
  name: string
  version: number
  metadata: JsonObject
  nodes: BackendWorkflowNodeDTO[]
}
```

Regular backend nodes preserve editor-domain node fields and add `next`:

```ts
type BackendRegularWorkflowNodeDTO = {
  id: number
  kind: Exclude<NodeKind, "evaluator">
  position: XYPosition
  label: string
  config: JsonObject
  next: number[]
}
```

Evaluator backend nodes preserve editor-domain node fields and add scalar branch references:

```ts
type BackendEvaluatorWorkflowNodeDTO = {
  id: number
  kind: "evaluator"
  position: XYPosition
  label: string
  config: JsonObject
  next_true: number | null
  next_false: number | null
}
```

`BackendWorkflowNodeDTO` is the union of regular and evaluator backend nodes.

## Ordering Strategy

The exporter will use Kahn-style topological ordering seeded by workflow roots.

1. Build indexes from the domain DTO:
   - `nodeById`
   - `incomingByTarget`
   - `outgoingBySource`
2. Find roots using `node.kind === "inlineExpression"` and `node.config.isRoot === true`.
3. Sort root nodes by:
   - `position.x`
   - `position.y`
   - `label`
   - old editor `id`
4. Process available nodes in that deterministic order.
5. Decrement remaining incoming counts for each outgoing target.
6. Only enqueue a downstream node when all of its incoming parents have already been processed.
7. Sort newly available nodes using:
   - source handle priority
   - target `position.x`
   - target `position.y`
   - target `label`
   - target editor `id`
8. After ordering, assign backend IDs as `index + 1`.

This handles converging branches correctly:

```text
A ----.
      v
    Shared -> Result
      ^
B ----'

Order: A, B, Shared, Result
```

## Link Mapping

After ordering and ID remapping:

- Non-evaluator nodes map all outgoing targets to `next: number[]`.
- `result` and other terminal nodes use `next: []`.
- Evaluator nodes map:
  - `sourceHandle === "evaluator-true"` to `next_true`
  - `sourceHandle === "evaluator-false"` to `next_false`
- Missing evaluator branches become `null`.

## Validation

The exporter will fail before returning a backend DTO when:

- the workflow has no root nodes
- any root node has incoming connections
- any connection references an unknown source or target node
- any non-root node is unreachable from roots
- the graph contains a cycle
- an evaluator has more than one true branch
- an evaluator has more than one false branch

Validation should happen inside the exporter so direct calls with manually assembled DTOs are still safe even if the editor usually prevents invalid states.

## Decisions

1. Add a dedicated backend export adapter instead of changing existing domain export.
- Rationale: backend execution schema has different ordering, ID, and linkage semantics from editor persistence.

2. Use topological ordering rather than depth-first traversal.
- Rationale: converging branches must emit shared downstream nodes after all of their reachable parents, for example `A, B, Shared, Result`.

3. Assign numeric backend IDs only after final ordering.
- Rationale: all graph processing remains on stable editor IDs until the final remap, reducing link corruption risk.

4. Preserve `position` in backend nodes.
- Rationale: backend consumers currently expect or may need layout information, and preserving it is harmless for this export contract.

## Risks / Trade-offs

- [Risk] Graphs with shared downstream nodes may require backend execution support for multiple incoming references. -> Mitigation: preserve one backend node ID and point all parents to it.
- [Risk] Existing editor invariants may drift from exporter validation. -> Mitigation: exporter owns its own validation and tests.
- [Risk] Sorting by position can change IDs after layout edits. -> Mitigation: this is acceptable because backend IDs are export-time IDs, not stable editor IDs.

## Migration Plan

1. Add backend DTO types and exporter in the mapper layer.
2. Add graph validation and topological ordering helpers.
3. Add focused tests for ordering, ID remapping, evaluator branch mapping, multiple roots, shared downstream nodes, terminal nodes, and validation failures.
4. Export the new utility and types from package entrypoints where existing workflow mappers/types are exposed.
5. Keep existing domain import/export tests unchanged except for any new exports.

## Open Questions

- None.
