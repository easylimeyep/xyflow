## Context

Evaluator condition operator options are currently selected from `condition.left.type` only. This is insufficient for template-driven left expressions (`{{ var }}`) because the upstream variable already has persisted type metadata (`config.variableType` on producer nodes), while evaluator still exposes value operators unless the user manually switches the left type.

The change must preserve existing evaluator config persistence (`left/right` typed operands and operator id), import/export DTOs, and existing runtime case-sensitive behavior. User direction for this change is:

- no manual override mode in phase 1;
- unknown/unresolved variable state should be surfaced with a yellow chip anchored at the top-right of the left input and a tooltip message;
- unresolved or non-inferable left expression should default to value (string) operator behavior;
- operator must auto-reconcile to the first valid option when inferred type changes invalidate current selection.

## Goals / Non-Goals

**Goals:**

- Introduce derived evaluator `effectiveLeftType` for operator catalog selection.
- Resolve template variable type from reachable upstream producer metadata.
- Preserve current behavior for explicit `left.type = array`.
- Show explicit unknown-variable signal in evaluator left input.
- Keep evaluator persistence and schema backward-compatible.

**Non-Goals:**

- Add or persist manual override state.
- Redesign `ExpressionInput` autocomplete contract for typed variable metadata.
- Add special multi-variable parsing logic beyond fallback behavior.
- Change runtime evaluator execution semantics outside existing operator/operand contracts.

## Decisions

1) Derive `effectiveLeftType` instead of changing persisted operand shape

Evaluator shall compute an in-memory type used only for UI operator selection:

- if `left.type === "array"` -> `effectiveLeftType = "array"`;
- else (`left.type === "value"`), attempt template inference from left expression;
- if inference succeeds and resolved upstream type is `array` -> `effectiveLeftType = "array"`;
- otherwise -> `effectiveLeftType = "value"`.

Rationale: preserves back-compat while enabling smarter behavior.

Alternative considered: mutating stored `left.type` to mirror inferred type. Rejected because it would silently rewrite persisted config and create migration risk.

### 2) Upstream producer metadata is the source of truth for inference

Inference must use reachable upstream variable producers and their persisted `config.variableType`:

- `setVariable.config.variableType`
- `extractor.config.variableType`

Rationale: this metadata is already canonical and persisted.

Alternative considered: infer by operator usage or expression syntax alone. Rejected because it is less reliable and can drift from actual workflow metadata.

### 3) Unknown/unresolved inference defaults to value operators and explicit warning chip

When left expression cannot resolve to a known upstream variable type, evaluator must:

- use value operator catalog;
- render an unresolved-variable chip (yellow) in top-right of left input;
- show tooltip on hover with unresolved explanation.

Rationale: keeps editor usable and transparent without blocking progress.

Alternative considered: hard error / blocking state. Rejected as too disruptive for iterative editing.

### 4) Inference-driven operator reconciliation is automatic and non-interactive

If `effectiveLeftType` changes and current operator is not present in the target catalog, evaluator auto-selects the first valid operator from that catalog and reconciles right operand with existing operator allow-type rules.

Rationale: prevents invalid stale selections while avoiding extra clicks.

Alternative considered: force explicit re-selection before continuing. Rejected due to unnecessary friction.

## Risks / Trade-offs

- **[Risk] False-positive template parsing for arbitrary text** -> **Mitigation:** apply strict single-variable template matching for inference path; all other forms fall back to value operators.
- **[Risk] Variable rename/delete causes sudden operator changes** -> **Mitigation:** deterministic fallback to value operators + unresolved chip + automatic operator reconciliation.
- **[Risk] Duplicate variable names upstream** -> **Mitigation:** use existing catalog resolution order and preserve current duplicate-handling policy; document deterministic first-match behavior in implementation notes/tests.
- **[Risk] UI clutter from warning chip** -> **Mitigation:** chip only in unresolved state; concise tooltip copy.

## Migration Plan

1. Add evaluator-side effective type resolution and unresolved-state derivation.
2. Wire operator catalog selection to `effectiveLeftType` and keep right-operand reconciliation flow.
3. Add unresolved chip + tooltip UI at left input container.
4. Add/update tests for inference, fallback, rename/delete, and operator auto-reconciliation.
5. Rollback strategy: revert to `left.type`-based operator selection; persisted workflow data remains compatible because no schema changes are introduced.

## Open Questions

- Should unresolved chip tooltip copy be localized immediately or follow existing editor i18n rollout pattern?
- If multiple upstream nodes provide the same variable name with different types, should evaluator expose diagnostic messaging in addition to deterministic fallback behavior?

