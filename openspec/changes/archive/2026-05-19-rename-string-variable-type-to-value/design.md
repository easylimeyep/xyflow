## Context

Workflow variable metadata currently models scalar values with the literal `string`. That literal appears in `WorkflowVariableType`, Extractor and Setter `config.variableType`, Evaluator typed operands, evaluator operator catalog groups, and operator `allowTypes`. The same word is also used throughout the codebase for ordinary JavaScript string checks, so the implementation must distinguish workflow type literals from data validation.

The target vocabulary is `value` for scalar workflow values and `array` for array workflow values. Evaluator operand objects keep their payload key named `value`; only the operand type discriminator changes.

## Goals / Non-Goals

**Goals:**

- Rename the workflow scalar type literal from `string` to `value` across config, UI, runtime metadata, and tests.
- Reject stale persisted/imported workflow type literal `string` at graph boundaries.
- Keep JavaScript value validation unchanged: scalar workflow values are still stored as JavaScript strings, and array workflow values are still stored as `string[]`.
- Keep evaluator operand payloads shaped as `{ type, value }`.

**Non-Goals:**

- Add new workflow value kinds beyond `value` and `array`.
- Rename ordinary domain strings, TypeScript `string` annotations, or `typeof value === "string"` checks.
- Split Setter value expressions into per-array rows or change evaluator comparison semantics.

## Decisions

### Treat `value` as a workflow type literal, not a data storage type

`WorkflowVariableType` should become `"value" | "array"`. Scalar operands should become `{ type: "value"; value: string }`, preserving the existing payload semantics.

Alternative considered: rename only UI labels while keeping persisted `string`. Rejected because the request is to rename the variable type everywhere, and keeping the old persisted literal would leave API, fixtures, and runtime catalogs inconsistent.

### Reject stale `string` literals at import/config boundaries

Node config validation should reject `variableType: "string"` and evaluator operand `type: "string"`. Runtime operator catalog overrides should reject a `string` group key or `allowTypes: ["string"]` instead of treating `string` as an alias for `value`.

Alternative considered: normalize old `string` literals to `value`. Rejected because it preserves two accepted names for the same workflow type and hides invalid callers.

### Preserve strict validation after the rename

Schemas should accept only `value` and `array` as workflow type literals. Unsupported values, including `string`, fail validation, and operand payload validation remains strict: `value` operands require a JavaScript string and `array` operands require arrays of JavaScript strings.

Alternative considered: accept both `string` and `value` indefinitely. Rejected because it creates two canonical names and makes future type-specific behavior harder to reason about.

### Update operator catalogs as part of the same rename

Evaluator operators are keyed by left operand type and constrain right operands through `allowTypes`. Both places should use `value` for scalar values. This keeps operator lookup, UI choices, and persisted operand types aligned.

Alternative considered: keep operator group keys as `string` while operands use `value`. Rejected because it forces adapter logic into every evaluator lookup path.

## Risks / Trade-offs

- [Risk] Broad literal replacement may accidentally alter ordinary JavaScript string checks. -> Mitigation: target workflow type literals and related labels/catalogs only, then rely on typecheck and focused tests.
- [Risk] Saved workflows with `string` type literals may fail import. -> Mitigation: this is intended strict behavior; callers must update payloads to `value`.
- [Risk] Operator defaults may fail if only some catalogs are renamed. -> Mitigation: update built-in catalog keys, operator `allowTypes`, condition reconciliation helpers, and UI tests in one pass.

## Migration Plan

1. Update core workflow type definitions and built-in defaults to use `value`.
2. Reject stale `string` workflow type literals at node config and runtime catalog boundaries.
3. Update UI labels, fixtures, mapper tests, clipboard tests, registry tests, and evaluator tests to assert `value` or rejection of `string`.
4. Run the package test suite/typecheck for `packages/flow`.
5. Rollback by reverting the literal rename if a downstream runtime cannot consume `value`.

## Open Questions

- None.
