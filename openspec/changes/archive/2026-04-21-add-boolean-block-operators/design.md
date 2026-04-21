## Context

Today the branch boolean block hardcodes its operator catalog in shared workflow types via `ConditionOperator`, `ALL_CONDITION_OPERATORS`, and `OPERATORS_WITH_TARGET`. `BranchNode` imports those constants directly, renders them in the operator select, and decides whether to show the second expression input by checking membership in a hardcoded list.

`WorkflowEditor` already accepts a `runtime` object and passes it through `WorkflowStoreProvider`, but that runtime contract currently only covers import/export domain mappers. This makes branch operator customization a cross-cutting change: we need a new public runtime surface, a typed operator definition contract, and a branch-node rendering path that resolves operator metadata from the mounted store instead of local constants.

The requested behavior is backward-compatible: if consumers do not pass operators, the editor must behave exactly as it does today.

## Goals / Non-Goals

**Goals:**
- Let `WorkflowEditor` consumers inject the operator catalog used by the branch boolean block.
- Define an operator shape that supports stable persisted ids and human-readable labels.
- Remove hardcoded "requires target value" logic from `BranchNode` and derive it from operator metadata.
- Preserve current behavior for existing consumers by defaulting to the current built-in operator set.
- Keep existing saved graphs readable even when a custom operator catalog omits a stored operator id.

**Non-Goals:**
- Change boolean-expression semantics outside the editor UI.
- Introduce localization, grouping, icons, or search UX for operator options in this change.
- Migrate old branch-condition payloads to a new persisted shape.
- Generalize this runtime-configuration pattern to every node type in the same change.

## Decisions

### 1. Add a branch-specific runtime contract under `WorkflowRuntimeConfig`

We will extend the runtime config with a branch namespace:

- `runtime.branch?.operators?: WorkflowBranchOperatorOption[]`

`WorkflowBranchOperatorOption` will include:

- `id: string`
- `value: string`
- `requiresTarget: boolean`

Why:
- `id` is the stable stored value for branch conditions.
- `value` is the display text shown in the select.
- `requiresTarget` replaces the current hardcoded `OPERATORS_WITH_TARGET` list and makes unary/binary operator behavior explicit.
- Nesting under `runtime.branch` keeps the API aligned with other focused runtime domains and leaves room for future branch-only customization.

Alternative considered:
- Add `branchOperators` at the top level of `WorkflowRuntimeConfig`. Rejected because it does not scale as cleanly if more branch-specific runtime settings are added later.

### 2. Preserve default persistence by keeping default operator ids equal to current labels

The built-in default operator catalog will be rewritten as structured objects, but each default `id` will remain the same string currently stored in `BranchCondition.operator` (`"is equal to"`, `"is empty"`, etc.).

Why:
- Existing graphs continue to work without migration.
- The branch-node config shape remains string-based for stored operator ids.
- Consumers can opt into custom ids later without breaking current defaults.

Alternative considered:
- Introduce new machine-friendly ids such as `eq`, `contains`, `is_null` for defaults. Rejected because it would require a migration or dual-read compatibility layer for existing saved graphs.

### 3. Sanitize runtime-provided operators before the UI consumes them

We will add a small normalization helper that:

- keeps only entries with non-empty `id` and `value`
- coerces `requiresTarget` to a boolean
- removes duplicates by `id` using first-write-wins semantics
- falls back to the default operator catalog when the provided list is empty after normalization

Why:
- The runtime contract is public, so the editor should defend itself against malformed arrays instead of crashing or rendering a broken select.
- A normalized list gives the branch node a stable, predictable source of truth.

Alternative considered:
- Trust runtime input and fail fast. Rejected because malformed consumer input would degrade the editor experience for a recoverable configuration mistake.

### 4. Resolve operator UI state from runtime metadata, not hardcoded constants

`BranchNode` will read the normalized operator catalog from the mounted workflow store runtime and use it for:

- rendering select items
- deciding whether the target-value input is visible
- choosing the default operator id when a new condition is added

Why:
- This centralizes branch operator behavior behind the runtime contract.
- New operators do not require editing node-local hardcoded arrays.

Alternative considered:
- Keep current constants and only let consumers override labels. Rejected because target-input behavior would still be hardcoded and custom operators would remain incomplete.

### 5. Preserve editability when a stored operator id is not present in the active catalog

If a branch condition already contains an operator id that is missing from the active runtime catalog, the branch node will surface a temporary fallback option for that id so the select stays controlled and the user can replace it deliberately.

Why:
- Consumers may switch catalogs while editing an existing workflow.
- Failing to represent the current value would create a broken or blank select state.

Alternative considered:
- Force unknown operators to reset to the default operator. Rejected because it mutates user data implicitly and could change branch behavior without an explicit edit.

## Risks / Trade-offs

- [Public runtime surface grows] More runtime namespaces can make the API harder to scan. → Mitigation: keep this change narrowly scoped to `runtime.branch.operators` and document only the new branch concern.
- [Custom ids may leak into exported graphs] Consumers must treat operator ids as part of their persisted data contract. → Mitigation: document that ids are stable persisted values and keep defaults backward-compatible.
- [Catalog drift can expose unknown stored operators] A consumer can remove an operator that existing graphs still use. → Mitigation: render a fallback option for unknown ids and avoid silent mutation.
- [Normalization hides malformed input] Silent fallback can mask consumer mistakes. → Mitigation: keep normalization rules simple and deterministic; tests should assert fallback behavior for empty/invalid catalogs.

## Migration Plan

1. Add the new branch runtime types and default operator catalog helpers.
2. Update `WorkflowEditor`/store runtime plumbing to expose normalized branch operators to mounted descendants.
3. Refactor `BranchNode` to consume runtime-driven operators for select rendering, target-input visibility, and new-condition defaults.
4. Add regression tests for default behavior, custom catalogs, invalid catalogs, and unknown stored operator ids.

Rollback strategy:
- Remove `runtime.branch.operators`, restore the branch-node hardcoded constants, and keep the default operator catalog local to the branch node if the public runtime API proves too disruptive.

## Open Questions

- None. The required operator shape, fallback behavior, and runtime-entrypoint location are sufficiently defined for implementation.
