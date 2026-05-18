## Context

Extractor and Setter both produce variables for downstream expressions, but only Extractor currently declares a persisted `variableType`. Their node UIs also differ: Extractor renders `Token Number` before its variable label and type, while Setter starts with its variable label. This makes the two variable-producing data nodes feel related in behavior but inconsistent in editing.

Evaluator conditions currently use a string-oriented shape: each condition has `value`, `operator`, and optional `targetValue`. That shape works for scalar expressions, but array operands require either overloading string fields or adding type-specific sibling fields. Because future operand types such as `date` are likely, the condition model should move to typed operand objects now rather than accumulating per-type fields.

## Goals / Non-Goals

**Goals:**

- Keep Extractor and Setter variable metadata symmetrical in config by using `variableType` on both nodes.
- Keep Extractor and Setter variable editing symmetrical in UI by rendering `Label` and `Type` in one single-line row before the remaining node-specific controls.
- Replace Evaluator string operands with typed operand objects that support `string` and `array` values.
- Allow Evaluator array operands on either side of a condition.
- Allow array operand rows to contain free text with spaces and allow empty arrays.
- Keep the Evaluator operator set unchanged for this change.
- Keep existing case-sensitive comparison semantics owned by backend/runtime consumers.

**Non-Goals:**

- Add new variable or operand types beyond `string` and `array`.
- Filter or redesign evaluator operators by operand type.
- Change expression syntax or expression-editor autocomplete behavior.
- Add editor-side runtime evaluation semantics.
- Preserve backward compatibility for old evaluator condition config shape without migration.

## Decisions

### Use one shared variable type key for variable-producing data nodes

Setter will add `config.variableType` using the same `WorkflowVariableType` union as Extractor. This keeps the persisted shape and UI vocabulary aligned:

```ts
type WorkflowVariableType = "string" | "array"

type SetVariableNodeConfig = {
  variableName: string
  variableType: WorkflowVariableType
  valueExpression: string
  clear: boolean
}
```

Alternative considered: name the Setter field `valueType` or `type`. That would describe the Setter value in isolation, but it would make Setter diverge from Extractor even though both declare the type of the variable they produce.

### Keep Setter array values expression-driven

Setter `valueExpression` remains a single expression input regardless of `variableType`. The type field is metadata for consumers, not a request to split Setter values into repeatable UI rows.

Alternative considered: make Setter `array` mode use the same repeatable row UI as Evaluator arrays. That would create a second way to author Setter values and blur the line between variable assignment and condition literals.

### Model Evaluator operands as typed objects

Evaluator conditions will move from scalar fields to explicit left/right operands:

```ts
type WorkflowTypedValue =
  | { type: "string"; value: string }
  | { type: "array"; value: string[] }

type EvaluatorCondition = {
  id: string
  left: WorkflowTypedValue
  operator: ConditionOperator
  right?: WorkflowTypedValue
}
```

This makes both operands independently typed and leaves room for future types such as `{ type: "date"; value: string }` without adding fields like `targetValueDate`.

Alternative considered: keep `value` and `targetValue` as strings and add `valueType`, `targetValueType`, `values`, and `targetValues`. That minimizes migration pressure, but it creates parallel fields that become awkward as soon as more types exist.

### Omit right operand when an operator does not require a target

Operators that do not require a target will store `right` as `undefined`. When a user switches to an operator that does require a target, the UI creates a default string right operand.

Alternative considered: always store `right` and hide it for targetless operators. That preserves hidden user input but sends misleading config to backend consumers for operators that do not use it.

### Convert array to string by taking the first element

When a user changes an operand from `array` to `string`, the string operand value becomes the first array item or an empty string if the array is empty. When a user changes from `string` to `array`, the array operand starts with the existing string value if it is non-empty, otherwise it starts empty.

Alternative considered: preserve hidden alternate-type drafts. That makes toggling friendlier, but it complicates persisted config with UI-only memory.

### Reuse repeatable row behavior, but not keyword token validation

Evaluator array operands should feel like the Keyword repeatable input pattern, but their rows are free-text values. Spaces are allowed, expressions may still be typed as text, and an empty array is valid.

Alternative considered: reuse Keyword token validation exactly. That would incorrectly reject legitimate string array entries such as `"New York"` or `"first value"`.

## Risks / Trade-offs

- Breaking condition config shape -> Update tests and mappers together so domain/backend export, clipboard, and import all agree on the new shape.
- Existing evaluator fixtures may fail loudly -> Treat this as useful migration pressure and update fixtures to the new typed operand contract.
- Operators remain unfiltered by type -> Document this as intentional scope control; backend/runtime consumers remain responsible for interpreting unsupported combinations.
- Empty arrays may be semantically ambiguous -> Preserve them because the user explicitly wants empty arrays to be allowed; backend validation can decide whether a given operator accepts them.
- A one-line Label/Type row can become tight inside a node -> Use stable control sizing so the row remains one line while the Label input owns most available width.

## Migration Plan

1. Add Setter `variableType` defaults, config validation, typed config updates, and roundtrip tests.
2. Update Extractor and Setter UI to render `Label` and `Type` in a shared single-line layout before node-specific controls.
3. Replace Evaluator condition types with `left` / `right` typed operands and update defaults.
4. Update Evaluator UI to render operand type selects plus either a scalar expression input or repeatable free-text array rows.
5. Update domain import/export, backend export, clipboard, and graph/store tests to use the new condition shape.
6. Rollback by reverting the change; workflows saved with the new evaluator typed operand shape would need payload conversion before older code could read them.

## Open Questions

None.
