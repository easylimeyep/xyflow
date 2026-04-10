## 1. Node Model and Registry

- [x] 1.1 Extend `inlineExpression` node config schema with `isRoot: boolean` defaulting to `false`, and update related workflow types.
- [x] 1.2 Remove `trigger` node definition and all active registry/type exports that include `trigger` as a supported kind.
- [x] 1.3 Update default graph initialization to create a `Keyword` node with `isRoot = true` instead of a `Trigger` node.

## 2. Keyword UI and Root Behavior

- [x] 2.1 Extend `NodeShell` header layout to support rendering a checkbox accessory next to the title.
- [x] 2.2 Add `Root` checkbox rendering and toggle handling in `InlineExpressionNode`.
- [x] 2.3 Hide `Keyword` input handle when `isRoot = true` and keep it visible otherwise.

## 3. Connection and Graph Integrity Rules

- [x] 3.1 Update connection validation to reject edges targeting `Keyword` nodes with `isRoot = true`.
- [x] 3.2 On `Keyword` root toggle from false to true, remove all existing incoming edges for that node in committed graph state.
- [x] 3.3 Ensure behavior supports multiple root keywords without uniqueness enforcement.

## 4. Tests and Regression Coverage

- [x] 4.1 Replace trigger-based fixtures/usages in registry, palette, store, validation, canvas, and expression tests with keyword-root-based fixtures.
- [x] 4.2 Add/adjust tests for root checkbox persistence, hidden input handle, incoming-edge rejection, and incoming-edge pruning on toggle.
- [x] 4.3 Add/adjust tests confirming trigger removal from palette/default graph and import rejection for legacy `trigger` payloads.
