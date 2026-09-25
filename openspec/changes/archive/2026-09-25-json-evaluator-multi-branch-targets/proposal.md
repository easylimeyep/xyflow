## Why

A JSON Evaluator routes a payload, and one outcome routinely feeds several consumers — an extractor
and a result, say — on the same branch. Today every evaluator output accepts exactly one target, so
the only way to fan out is to chain nodes that have nothing to do with each other. The plain
Evaluator's one-target-per-branch contract is still what its backend executes, so the change must
not touch it.

## What Changes

- A node definition may declare that its `true`/`false` branch handles fan out to several targets.
  The built-in JSON Evaluator declares it; the plain Evaluator does not, and behaves exactly as
  before. The rule lives on the definition a host hands the editor, not in a list of kinds, so a
  host can switch it for either evaluator.
- Connection validation accepts further targets on a fan-out branch. An exact duplicate edge is
  still rejected.
- Branch quick-add stays available on a fan-out branch after it is connected.
- Backend export (strict and draft) serializes a fan-out evaluator's branches as lists:
  `next_true: number[]`, `next_false: number[]`, with `[]` for an unconnected branch. A
  single-target evaluator keeps `next_true: number | null`. Strict export stops rejecting several
  targets on a fan-out branch.
- **BREAKING**: `exportDomainWorkflowForBackend` and `exportDraftDomainWorkflowForBackend` take the
  editor's node registry as their first argument, since the serialized shape now depends on it.
- **BREAKING**: `BackendEvaluatorWorkflowNodeDTO` becomes a union of a single-target and a
  multi-target shape; `isMultiTargetEvaluatorDTO` tells them apart.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `workflow-persistence-v2`: backend export takes the node registry; fan-out evaluators export
  branch lists and may have several targets per branch; the single-outgoing-connection rule applies
  only to single-target evaluators.
- `workflow-evaluator-node`: branch quick-add stays visible on a connected fan-out branch.

## Impact

- `packages/flow` node registry (`NodeDefinition`, graph rules), connection validation, quick-add
  store slices and affordance, backend export mapper and DTO types, ELK shortcut clearance.
- Public API of `@flow/flow`: new `isMultiTargetEvaluatorDTO`, the two new DTO types, and the new
  export signatures. Hosts calling the export functions must pass a registry — `useNodeRegistry()`
  inside the editor, `createNodeRegistry(definitions)` outside it.
- Backend: must accept `next_true` / `next_false` as `number[]` for `jsonEvaluator` nodes (agreed).
- Storybook backend-transform example updated to the new signature.
