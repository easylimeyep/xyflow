## Context

See proposal.md for motivation. Current state that shapes the approach:

- `ExpressionInput` (flow) wraps `ExpressionEditor` (`@flow/expression-editor`). It emits the whole document as one string (`"prefix-{{ id }}"`) via `onChange` on commit (blur, Enter, variable insert) and via `onLiveChange` on every keystroke. A value operand already stores exactly that string.
- `ArrayInputPopover` lives in `packages/ui`, renders a plain `<Input>` per row, and by spec must stay workflow-agnostic. Its popover content is fixed at `w-56`.
- `ArrayOperandPopover` (flow, `operand-editor.tsx`) holds the draft `string[]` and commits it when the popover closes.
- Unresolved detection lives in `resolveEffectiveLeftOperandType` (`operands.ts`): the value must be exactly `{{ identifier }}`, and the name must be absent from `variableTypes`. Only the left operand receives `variableTypes` and `unresolvedVariableName`.
- Rename refactoring (`expression/refactor/refactor.ts`) only rewrites config keys whose value is a `string` or a `string[]`, discovered from `fields`, `extraExpressionConfigKeys`, and `renameConfigKey`. Evaluators declare `fields: []`, so `conditions` is never visited.

## Goals / Non-Goals

**Goals:**
- Array rows use the same editor as value operands, with no change to the stored shape.
- One unresolved-variable rule, shared by every operand and row.
- Rename refactoring reaches condition operands through definition metadata, with no kind checks in the refactor dispatcher.

**Non-Goals:**
- Typed array entries (`{ kind: "literal" | "variable" }`).
- Interpreting array variables (flattening, element typing). The backend owns this.
- Unresolved detection for mixed templates or member access (`{{ a.b }}`). The existing single-identifier rule stays as is.
- Changing how the left value operand infers its type or selects operators.

## Decisions

### D1. Rows stay template strings (`string[]`)
Each row is exactly what `ExpressionInput` emits. This gives symmetry with value operands: the same validator (`isOperandValue`), persistence, export, and refactor path.
*Alternative:* typed entries. Rejected because it is a breaking schema change for no gain, and mixed text would need a third entry kind.

### D2. Row-render slot on `ArrayInputPopover`
Add an optional `renderEntry?: (props: { value; index; ariaLabel; onChange }) => ReactNode`. When it is absent, the component renders the current `<Input>`. The delete button and "Add value" stay owned by the component. Flow passes a renderer that returns `ExpressionInput`.
*Alternative:* pass an input component type. Rejected because a render function is more flexible (per-row warning adornment) and keeps the props plain.

### D3. Preview badge decoration also goes through the UI component, which stays agnostic
Add an optional `getEntryMeta?: (value, index) => { variant?: "literal" | "variable"; warning?: string }`. The UI component maps `variant` to badge styling and renders a small warning icon plus a tooltip when `warning` is set. It never parses `{{ }}` itself. Flow computes the meta from a shared helper.
*Alternative:* a full `renderPreviewBadge` slot. Rejected because it would duplicate badge sizing and truncation logic in flow.

### D4. Shared helpers in `operands.ts`
- `parseSingleVariableTemplate` (already exists) decides whether a row is a "variable row".
- New `findUnresolvedVariable(value, variableTypes): string | undefined` is used by value operands and each array row.
- `resolveEffectiveLeftOperandType` now only resolves the operand type; it no longer reports the unresolved name, since every operand editor asks `findUnresolvedVariable` itself. Both read references through `parseSingleVariableTemplate`, so the rule has one definition.

`ConditionRow` passes `variableTypes` to both `OperandEditor`s. `OperandEditor` computes `unresolvedVariableName` itself for value operands, which removes the left-only prop wiring and gives the right operand its chip. The unresolved chip JSX is extracted so the value input and array rows share it.

### D5. Draft captures live edits
`ExpressionEditor` reads `onLiveChange` through a ref, so a parent passing a fresh listener each render does not hand CodeMirror a new change handler (which would reconfigure every row's editor on each keystroke).
The flow row renderer wires `ExpressionInput.onLiveChange` and `onChange` to the draft setter. Closing the popover then commits the latest keystrokes even if CodeMirror never blurred. The commit timing (config updates only on close) stays unchanged.

### D6. Popover width
Keep the UI default (`w-56`) and add a `popoverClassName` prop; flow passes `w-80` through its `tv` styles, so the UI package never needs to know why. The trigger keeps `w-full`.

### D7. Structured refactor hook on `NodeDefinition`
Add an optional `refactorConfigValue?: (key: string, value: JsonValue, rewrite: (template: string) => string) => JsonValue`; the evaluator implementation casts once, where the condition shape is known. In `refactorExpressionFieldsInGraph`, after the existing string and string[] handling, every config key for which the definition declares this hook is passed through it. Identity is preserved by reference equality: if the hook returns the same value, the key counts as unchanged. Evaluator and JSON evaluator share one implementation in `evaluator-shared/config.ts` that maps `conditions[]` → `left`/`right`, rewrites `value` strings and array rows, and returns the original objects when nothing changed. A condition that fails validation is passed through untouched without holding back the valid conditions beside it.
*Alternative:* flatten conditions into declared expression keys, or teach the refactor about `conditions`. Rejected because both violate "no hardcoded node kind strings" or would force the stored shape to change.

## Risks / Trade-offs

- [One CodeMirror instance per row inside a popover] → Rows are few in practice. Mount the instances only while the popover is open, which is already the case.
- [Autocomplete dropdown clipped by the popover] → Verify in the browser. The expression editor's autocomplete should portal or overflow correctly. If it doesn't, give the popover `overflow-visible`.
- [Focus/blur between CodeMirror and the popover dismiss logic] → A click on the autocomplete list must not close the popover. Cover this with an integration test.
- [Variable badge heuristic ignores `{{ a.b }}`] → Such rows render as literal badges, which is acceptable per Non-Goals and matches existing left-operand behavior.
- [`ArrayInputPopover` API growth] → All new props are optional, so existing callers and tests keep working unchanged.

## Migration Plan

No data migration. Stored configs already hold `string[]`. Rows that happen to contain `{{ … }}` start rendering as expressions, which is the intended behavior.
