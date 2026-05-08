## Context

Evaluator nodes expose two named output handles:

- `evaluator-true`
- `evaluator-false`

Backend export maps those handles to scalar backend fields:

- `evaluator-true` -> `next_true`
- `evaluator-false` -> `next_false`

Any evaluator outgoing edge with `sourceHandle: null` cannot be represented in the backend DTO. The exporter correctly rejects that state, but the editor can still create it when inserting an evaluator on an existing edge.

The observed invalid canvas has this shape:

```text
Root A ----.
          v
       Eligibility
          | evaluator-true
          v
       Evaluator 2
          | null
          v
       Qualified
```

The UI then shows the true branch quick-add button on `Evaluator 2` because quick-add occupancy checks are handle-specific:

```text
has outgoing for evaluator-true? no
has outgoing for null? yes
```

## Goals / Non-Goals

**Goals:**
- Prevent editor-created evaluator outgoing edges with `sourceHandle: null`.
- Preserve the existing evaluator handle IDs.
- Make edge insertion produce backend-exportable evaluator continuations.
- Keep branch quick-add affordances accurate for the persisted edge handle data.
- Add focused regression tests for the broken path.

**Non-Goals:**
- No change to backend export DTO shape.
- No auto-repair of arbitrary imported malformed payloads in this change.
- No change to regular node default-output behavior.
- No new evaluator branch labels or branch semantics.

## Connection Validation

`validateConnection` should reject outgoing connections from evaluator nodes unless `connection.sourceHandle` is one of:

- `evaluator-true`
- `evaluator-false`

This validation should run for:

- direct canvas connections through React Flow
- quick-add connections, because they use the same graph command path
- edge insertion split edges, because split legs are validated before being committed

This keeps the editor's graph invariant aligned with backend export validation.

## Edge Insertion

When inserting a node on an edge, the algorithm creates two candidate legs:

```text
source -> inserted
inserted -> target
```

The existing behavior uses the original edge source handle for `source -> inserted` and uses `null` for `inserted -> target`.
That remains correct for regular inserted nodes, but it is invalid when the inserted node is an evaluator.

For inserted evaluator nodes, the continuation edge should use `evaluator-true` by default:

```text
source -> inserted evaluator
inserted evaluator -- evaluator-true --> target
```

The false branch remains unconnected and available for quick-add.

Rationale:
- This matches the mental model of inserting a conditional check into an existing success path.
- It keeps the previous downstream path reachable without asking for an extra branch choice.
- It avoids introducing a modal or branch picker in the first fix.

## Quick-Add Affordance

No broad quick-add rewrite is needed if stored edges are corrected.
`OutputQuickAddAffordance` already hides a `+` for a branch when an edge exists with the same `sourceHandle`.

After edge insertion creates `inserted evaluator -> target` with `sourceHandle: "evaluator-true"`:

```text
true branch has outgoing edge -> hide true +
false branch has no outgoing edge -> show false +
```

This is the desired behavior.

## Validation and Error Messaging

The graph command should surface a clear invalid-connection error when a caller attempts to connect from an evaluator without a named branch handle.
Suggested message:

```text
Evaluator node connections must use a true or false output handle.
```

The exact text can follow existing error style, but tests should assert the reason is evaluator/handle-specific enough to diagnose the issue.

## Tests

Add tests covering:

- Direct connection validation rejects evaluator outgoing connections with `sourceHandle: null`.
- Direct connection validation accepts `evaluator-true` and `evaluator-false`.
- Edge insertion with inserted evaluator creates the inserted-to-target edge with `sourceHandle: "evaluator-true"`.
- Store-level edge insertion regression matching `Eligibility true -> Qualified`, then insert evaluator.
- Quick-add affordance hides the true branch button when a true edge exists and leaves false available.
- Backend export succeeds for the edge-insertion result.

## Risks / Trade-offs

- [Risk] Defaulting inserted evaluator continuation to true may not match every user intent. -> Mitigation: this is predictable and preserves the existing path; users can rewire to false if needed.
- [Risk] Existing saved invalid canvases may still fail export. -> Mitigation: this change prevents new invalid UI-created states; import repair can be handled separately if needed.
- [Risk] Validation changes may expose previously silent invalid calls in tests. -> Mitigation: update fixtures to use explicit evaluator handles where the source is evaluator.

## Open Questions

- Should a future enhancement offer a branch picker when inserting an evaluator on an edge, instead of always choosing true?
