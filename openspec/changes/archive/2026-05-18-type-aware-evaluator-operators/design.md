## Context

Evaluator conditions already persist typed operands as `{ type: "string" | "array", value }`, but evaluator operators are still configured as one flat runtime array with a `requiresTarget` boolean. That flat catalog cannot express that a string left operand and an array left operand expose different operators, or that a selected operator only accepts a specific right operand type.

The new backend-facing operator schema is type-aware. Consumers will provide operators in the new runtime format, so this change is intentionally breaking for the evaluator operator API.

## Goals / Non-Goals

**Goals:**

- Represent evaluator operators as a typed runtime catalog keyed by left operand type.
- Replace `requiresTarget` with `allowTypes`, using `["none"]` for unary operators.
- Keep evaluator condition persistence focused on typed operands plus the selected operator id.
- Make evaluator UI choices deterministic when operand type or operator changes.
- Keep the built-in default catalog available for consumers that omit runtime operators.

**Non-Goals:**

- Supporting the previous flat `runtime.evaluator.operators` shape.
- Adding local validation warnings for incompatible stored conditions.
- Changing backend export shape for evaluator node config.
- Adding new operand types beyond `string`, `array`, and the `none` right-operand sentinel.

## Decisions

### 1. Use a typed operator catalog in runtime

`WorkflowRuntimeConfig.evaluator.operators` will become:

```ts
{
  string: WorkflowEvaluatorOperatorOption[]
  array: WorkflowEvaluatorOperatorOption[]
}
```

Each operator will include:

```ts
{
  id: string
  value: string
  allowTypes: Array<"string" | "array" | "none">
}
```

The top-level key identifies the left operand type. `allowTypes` identifies allowed right operand types, except `["none"]`, which means the operator is unary and `right` is omitted.

Alternative considered: keep a flat list and add `operandType` to each operator. The keyed object is closer to the incoming workflow schema and avoids repeatedly filtering the entire catalog.

### 2. Treat operator ids as unique only within a left operand type group

The same operator id may appear in both `string` and `array` groups. Operator metadata lookup must always use `operators[condition.left.type]` before matching `condition.operator`.

Alternative considered: require globally unique ids. That would simplify lookup, but it would leak an editor implementation constraint into an API where the backend already scopes operators by operand type.

### 3. Normalize runtime operators strictly

Runtime normalization will trim `id` and `value`, remove duplicates within each type group, and accept only `allowTypes` values of `string`, `array`, and `none`.

`none` must be the only allowed type when present. Operators with empty ids, empty labels, invalid `allowTypes`, or mixed `none` plus operand types will be ignored. If a group becomes empty after normalization, it will fall back to the built-in default group for that left operand type.

Alternative considered: coerce invalid `allowTypes` into a best-effort value. Strict normalization makes integration mistakes easier to detect during tests and avoids ambiguous UI states.

### 4. Resolve evaluator condition edits from the active left operand group

The condition operator select will render only operators from the current left operand type group. When the user changes the left operand type, the editor will:

1. convert the left operand value to the new type using existing operand conversion behavior;
2. check whether the current operator exists in the new type group;
3. keep the operator if it exists, otherwise select the first operator from the new group;
4. reconcile `right` against the selected operator's `allowTypes`.

If `allowTypes` is `["none"]`, `right` is removed. If a right operand is required and the current `right` type is not allowed, the editor creates an empty right operand using the first allowed type.

Alternative considered: preserve incompatible operators until the user changes them explicitly. The new runtime schema is authoritative and always provided in the new format, so strict reconciliation is simpler and keeps edited conditions valid.

### 5. Restrict right operand type selection

The right operand type picker will show only `string` and/or `array` values present in the selected operator's `allowTypes`. Unary operators will not render the right operand row.

The order of `allowTypes` is significant for default right operand creation. For example, `["array", "string"]` defaults a missing or incompatible right operand to an empty array operand.

Alternative considered: keep both right operand types visible and validate later. Restricting the picker prevents invalid combinations from being created through the UI.

### 6. Keep backend export shape unchanged

Domain and backend export will continue copying evaluator `config` with typed operands and selected operator ids. The editor runtime catalog governs authoring behavior, while execution semantics remain owned by the consumer/backend.

Alternative considered: embed operator metadata into exported workflow config. That would make workflow payloads self-describing, but it would duplicate runtime schema data and increase migration scope.

## Risks / Trade-offs

- [Breaking runtime API] Existing consumers passing a flat operator array will fail type checks or fall back incorrectly. → Document the breaking change in specs and tests, and update example usage in the implementation pass.
- [Ambiguous array semantics] Array operators like `contains` could mean contains one string, contains all, or overlaps. → The built-in default catalog will only include `array.contains` with a string right operand.
- [Silent fallback for invalid runtime groups] If all custom operators in a group are invalid, the editor falls back to defaults. → Unit tests should cover normalization so integrations catch invalid catalogs early.
- [Condition reconciliation can clear user-entered right values] Incompatible right operands are replaced with empty operands. → Only do this when the user changes left type or operator, where a semantic change is already explicit.

## Migration Plan

1. Update public runtime types and default operator constants.
2. Update runtime normalization to accept only the new typed catalog.
3. Refactor evaluator UI to resolve operators by `left.type` and reconcile right operands from `allowTypes`.
4. Update tests and examples from `requiresTarget` to `allowTypes`.
5. Remove legacy fallback behavior for unknown operators in the evaluator operator select.

Rollback is to restore the flat runtime operator type, `requiresTarget` metadata, and unfiltered evaluator operator select. Because this is a breaking API change, rollback requires restoring consumer usage as well.

## Open Questions

None.
