# Tasks

## 1. Stable field identity

- [x] 1.1 Extend `NodeConfigValueRefactor`'s `rewrite` with an optional `path` argument, and document the fallback on the type. In `mapExpressionFields`, use the supplied path and fall back to `key#n` when none is given. Verify:
  - an `expression-fields.test.ts` case where a custom refactor passes paths, and one where it passes none;
  - the existing `refactor.test.ts` passes unchanged.
- [x] 1.2 Make `refactorEvaluatorConfigValue` pass `conditions[<id>].left|right`, and `...left[<i>]` / `...right[<i>]` for array operands. Verify:
  - an `expression-fields.test.ts` case asserting these paths;
  - a `store.search.test.ts` case for the spec scenario "Removing an earlier condition keeps the current match".

## 2. Definition matches anchored to their field

- [x] 2.1 In `buildSearchMatches`, give a definition match `fieldPath = renameConfigKey` when that key's trimmed value equals the reported name. Drop the match when the name equals the trimmed node label and no key holds it. Otherwise keep it without a `fieldPath`. Verify with `matches.test.ts` cases for:
  - a setter (anchored to `variableName`);
  - an extractor with its own name (anchored to `extractExpression`);
  - an extractor falling back to its label (dropped);
  - a path extractor (dropped);
  - a host kind with no `renameConfigKey` (kept, no field).
- [x] 2.2 Update the Storybook canvas-search example counts and any existing test expectations the dedup changes. Verify with `pnpm test` in `packages/flow`.

## 3. Field status in the store

- [x] 3.1 Add a per-node field index to the match-index cache, plus `selectFieldSearchStatus(state, nodeId, fieldKey, { includeChildren? })`. It returns `none | match | current`, and `"none"` immediately while search is closed. Add `selectNodeHasCurrentField`. Export the hooks `useFieldSearchStatus` and `useNodeHasCurrentField`. Verify with `store.search.test.ts` cases covering:
  - `label`, definition and reference keys;
  - the `includeChildren` roll-up for array operands;
  - the closed state.
- [x] 3.2 Extend `use-node-search-status.test.tsx` with field probes. Moving the current match between two fields must re-render only those two probes, and moving it within one field (two occurrences) must re-render none. Verify the test passes.

## 4. Marks in the UI

- [x] 4.1 Add a shared `searchFieldStyles` `tv` definition (`none | match | current`) and an optional `searchState` prop on `ExpressionInput` that renders the marked wrapper. Use `tv` only. Verify with an `ExpressionInput` render test covering all three states.
- [x] 4.2 In `NodeShell`:
  - add `titleSearchState`;
  - add `hasCurrentField` to demote the current-node ring to a thin primary outline;
  - keep the strong ring when there is no current field;
  - pass both through from `DefaultNodeRenderer` / `buildNodeTypes`.

  Verify with `node-shell.test.tsx` cases for the title marks and both current-node variants.
- [x] 4.3 Wire the field marks into the node views through store-bound wrappers (`SearchFieldMark`, `SearchMarkedExpressionInput`, see design §4):
  - setter view: variable-name input and value expression;
  - extractor: variable-name input;
  - evaluator view: label input, and per-operand state from `ConditionRow`, including the array-operand trigger via `includeChildren`. Report `hasCurrentField` only for rendered conditions;
  - inline expression: each `KeywordExpressionListInput` row marks `template[i]`.

  Wrap the existing node-view unit tests in a `WorkflowStoreProvider`. Verify with a field-mark test that renders each view inside a store with an open search and asserts which field carries which mark.
- [x] 4.4 Add a `workflow-editor.search.test.tsx` case for the spec scenario "The mark moves between matches in one node": the title mark and the variable-field mark swap on `Enter`. Verify that the test passes.

## 5. Integration

- [x] 5.1 Extend the e2e spec `apps/web/e2e/workflow-canvas-search.spec.ts`. Step from a node's label match to its variable match, and assert that the strong mark moves from the title to the field (`data-field-search-state="current"` on the field) while the node keeps the outline. Verify that the spec passes locally.
- [x] 5.2 Check the Storybook story visually in both themes (screenshots at 1440 and 1024): the mark visibly moves on each step within a node. Then run `pnpm typecheck`, `pnpm test` (including `store.performance.test.ts`) and lint on the changed files. Verify that all are green and the `flow` coverage threshold holds.
