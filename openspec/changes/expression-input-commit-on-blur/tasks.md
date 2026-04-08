## 1. Update ExpressionInput

- [x] 1.1 Add `liveValue` state (initialized from `value` prop) and a `useEffect` to sync it when `value` changes externally (undo/redo)
- [x] 1.2 Replace `validateTemplateExpression(value)` with `validateTemplateExpression(liveValue)` for live validation
- [x] 1.3 Update `handleChange` to set `liveValue` via `setLiveValue` on every keystroke and keep `{{}}` trigger detection — remove the `props.onChange` call from this handler
- [x] 1.4 Add a `commitRef` (mutable ref holding the latest commit callback): captures `view.state.doc.toString()` and calls `props.onChange` only if content differs from `value`
- [x] 1.5 Create a stable `commitExtension` (empty deps, reads `commitRef.current` inside) using `EditorView.updateListener.of` to detect `focusChanged && !view.hasFocus` → call `commitRef.current()`
- [x] 1.6 Add Enter key handling inside the same or a separate extension via `EditorView.domEventHandlers({ keydown })`: on Enter (no Shift) call `commitRef.current()` then `view.dom.blur()`
- [x] 1.7 Include `commitExtension` in the `extensions` array passed to CodeMirror
- [x] 1.8 Remove `value` from `handleChange`'s `useCallback` dependency array (it no longer needs it); remove `onChange` from deps too — only `setLiveValue`, `setPickerOpen`, `pickerOpen` remain
- [x] 1.9 Verify `insertVariable` still calls `props.onChange` immediately (no change needed, but confirm)

## 2. Remove InlineEditField from nodes

- [x] 2.1 `extractor-node.tsx`: remove `InlineEditField` wrapper around `ExpressionInput`, wire `onChange` directly to `updateNodeConfig(id, { kind: "extractor", key: "extractExpression", value: v })`
- [x] 2.2 `set-variable-node.tsx`: remove `InlineEditField` wrapper around `ExpressionInput`, wire `onChange` directly to `updateNodeConfig(id, { kind: "setVariable", key: "valueExpression", value: v })`
- [x] 2.3 `inline-expression-node.tsx`: remove `InlineEditField` wrapper around `ExpressionInput`, wire `onChange` directly to `updateNodeConfig(id, { kind: "inlineExpression", key: "template", value: v })`
- [x] 2.4 Remove unused `InlineEditField` imports from all three nodes

## 3. Delete InlineEditField

- [x] 3.1 Delete `packages/flow/src/workflow/nodes/shared/inline-edit-field.tsx`
- [x] 3.2 Delete `packages/flow/src/workflow/nodes/shared/inline-edit-field.test.tsx`
- [x] 3.3 Remove `export * from "./inline-edit-field"` from `packages/flow/src/workflow/nodes/shared/index.ts`

## 4. Tests

- [x] 4.1 Update or remove any existing tests in `expression-input.integration.test.tsx` that relied on per-keystroke `onChange` calls
- [x] 4.2 Add integration test: type into ExpressionInput, do not blur → `onChange` not called
- [x] 4.3 Add integration test: type into ExpressionInput, blur → `onChange` called once with full value
- [x] 4.4 Add integration test: type quickly and blur within 200ms → value does not revert (regression test for the original bug)
- [x] 4.5 Add integration test: press Enter → `onChange` called and editor loses focus
- [x] 4.6 Add integration test: Shift+Enter → `onChange` NOT called
- [x] 4.7 Run `pnpm test` in `packages/flow` and confirm all tests pass

## 5. Verification

- [x] 5.1 Manual smoke test: open extractor-node, type an expression quickly and click away — value must persist
- [x] 5.2 Manual smoke test: open set-variable-node, type and blur — value persists, one undo entry created
- [x] 5.3 Manual smoke test: undo/redo restores values correctly across multiple field edits
- [x] 5.4 Manual smoke test: variable picker insertion calls onChange and persists to store immediately
- [x] 5.5 Run `pnpm typecheck` — no TypeScript errors
