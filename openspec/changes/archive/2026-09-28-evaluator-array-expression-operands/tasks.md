## 1. Shared operand helpers

- [x] 1.1 Add `findUnresolvedVariable(value, variableTypes)` and an `isVariableReference(value)` helper to `evaluator-shared/operands.ts`, and drop the now-unused `unresolvedVariableName` from `resolveEffectiveLeftOperandType`; verify with unit tests covering literal, single variable (resolved/unresolved), mixed text, and `{{ a.b }}`
- [x] 1.2 Add an evaluator-shared `refactorEvaluatorConfigValue(key, value, rewrite)` that rewrites `left`/`right` value strings and array rows, skips upstream operands, and returns the original references when nothing changed; verify with unit tests for value, array, mixed rows, and no-op identity

## 2. Structured refactor hook

- [x] 2.1 Add optional `refactorConfigValue` to `NodeDefinition` in `node-registry/define-node.ts`; verify `pnpm typecheck` passes
- [x] 2.2 Apply the hook in `expression/refactor/refactor.ts` for keys the definition declares, with no kind-specific branching; verify with `refactor.test.ts` cases for applied rewrite, undeclared structured value untouched, and unchanged node identity
- [x] 2.3 Wire `refactorConfigValue` into the `evaluator` and `jsonEvaluator` definitions; verify with a graph-level test that renaming `city` → `town` rewrites `{{ city }}` in both operands and in array rows

## 3. Reusable ArrayInputPopover (packages/ui)

- [x] 3.1 Add optional `renderEntry` slot with plain-`<Input>` fallback; verify existing `array-input-popover.test.tsx` passes unchanged and a new test renders a custom entry
- [x] 3.2 Add optional `getEntryMeta` for preview badges (`variant: "literal" | "variable"`, `warning`) that renders variable styling and a small warning icon with tooltip; verify with tests for both variants and the warning tooltip
- [x] 3.3 Add a `popoverClassName` prop and make the popover width independent of the trigger; verify by test that the class is applied

## 4. Evaluator operand editor

- [x] 4.1 Extract the unresolved warning chip into a shared component used by the value input and array rows; verify existing left-operand warning tests still pass
- [x] 4.2 Pass `variableTypes` to both operands in `condition-row.tsx` and compute `unresolvedVariableName` inside `OperandEditor`; verify with a component test that a right value operand `{{ missing }}` shows the chip and operators do not change
- [x] 4.3 Render array rows through `renderEntry` with `ExpressionInput` (variables + per-row warning) and feed `onLiveChange`/`onChange` into the draft; verify with a test that typing into a row and closing the popover without blur commits the typed value
- [x] 4.4 Supply `getEntryMeta` from the shared helpers and a wider `popoverClassName`; verify with tests that `{{ city }}` previews as a variable badge, `prefix-{{ id }}` as a literal, and an unresolved row carries the warning icon

## 5. Integration and verification

- [x] 5.1 Verify both the evaluator and JSON evaluator node component tests cover array expression rows on the left and right operands
- [x] 5.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` in `packages/ui` and `packages/flow`; all pass with coverage thresholds met
- [x] 5.3 In the browser, verify autocomplete inside an array row is not clipped by the popover, that clicking a suggestion does not close the popover, and that the variable/warning badges look right in light and dark themes

## 6. Review follow-ups

- [x] 6.1 Read `onLiveChange` through a ref in `ExpressionEditor` so rows do not reconfigure CodeMirror on every keystroke; verified by an integration test that fails on the old dependency list
- [x] 6.2 Rewrite valid conditions next to a malformed one during rename; verified by a `config.test.ts` case
- [x] 6.3 Type `NodeConfigValueRefactor` as `JsonValue` in and out, with the single cast inside the evaluator implementation; verified by `pnpm typecheck`
- [x] 6.4 Cover rename through clipboard paste for evaluator conditions (`store.clipboard.test.ts`, fails without the hook), live-edit commit through the real `ExpressionEditor` (`operand-editor.integration.test.tsx`), and picker insertion without closing the popover in a real browser (`apps/web/e2e/evaluator-array-operand.spec.ts`)
