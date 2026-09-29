# Tasks

## 0. Prerequisite

- [x] 0.1 Archive `workflow-canvas-search-field-marks` (`/opsx:archive`) and verify `openspec/specs/workflow-canvas-search/spec.md` contains its field-mark requirements. Then `openspec validate workflow-canvas-search-results-panel --strict` passes.

## 1. Matching options

- [x] 1.1 Add `SearchMatchOptions { matchCase; wholeWord }` to `search/matches.ts` and thread it through `buildSearchMatches`, `findOccurrences`, and `findReferenceOccurrences`. Match case skips lower-casing. Whole word checks `/[\p{L}\p{N}_$]/u` at `start - 1` and `end`, and a rejected candidate resumes the scan at `cursor + 1`. Verify with `matches.test.ts` cases:
  - case on/off for a label;
  - `{{rate}}` vs `{{max_rate}}` vs `{{rate.value}}` with whole word;
  - `ratex rate` still finding the second hit;
  - a Cyrillic label;
  - unchanged keys for matches that survive an option toggle.

## 2. Store: state, filtering, actions

- [x] 2.1 Extend `WorkflowSearchState` (`store/types.ts`) with `isResultsOpen`, `options`, and `sources`, with defaults: collapsed, both options off, all three sources on. Verify with `pnpm typecheck` in `packages/flow`.
- [x] 2.2 In `search-selectors.ts`:
  - key the match index on `(nodes, query, options)`;
  - add a separately cached source filter pass keyed by the full list and `sources`;
  - build `matchedNodeIds` / `fieldKeysByNode` from the filtered list;
  - add `selectSearchSourceCounts` and `selectSearchHiddenByFilters`.

  Verify in `store.search.test.ts`:
  - disabling a source removes its matches from the total, next/prev, and node/field status;
  - a source toggle does not rebuild the index (same full-list reference);
  - removing the current match by a filter moves it to the nearest following match.
- [x] 2.3 Slice actions (`slices/search-slice.ts`):
  - `toggleSearchResults`;
  - `setSearchOption(name, value)`;
  - `setSearchSources(sources)`;
  - `resetSearchSources`;
  - `setSearchCurrentMatch(key)`, which does nothing for an unknown key.

  Change `closeSearch` to keep `isResultsOpen`, `options`, and `sources`, and to return the same state when already closed and empty. Verify with slice tests:
  - preferences survive close/reopen;
  - `setSearchCurrentMatch` sets the key and sort tuple and leaves selection and history untouched;
  - a redundant close does not notify subscribers (`use-node-search-status.test.tsx` pattern).

## 3. Row description

- [x] 3.1 Add optional `describeExpressionField?: (fieldPath, config) => string | undefined` to the node definition in `node-registry/define-node.ts` with a doc comment. Implement it for the evaluator kinds in `nodes/logic/evaluator-shared` as "Condition N · Left operand" / "Right operand", using the one-based position of the condition id. Verify with a unit test in `evaluator-shared`, including an unknown condition id returning `undefined`.
- [x] 3.2 Add `search/describe-match.ts`. Given `(registry, node, match)`, it returns a field name and a snippet `{ before, hit, after, clippedStart, clippedEnd }` with a ±24 character window and collapsed newlines. Field names resolve in order:
  1. "Label";
  2. the schema label;
  3. `Label #i`;
  4. `describeExpressionField`;
  5. "Expression".

  Verify with `describe-match.test.ts` covering each field-name branch, clipping at both ends, and a reference inside a template with several segments.

## 4. UI primitive

- [x] 4.1 Add `packages/ui/src/components/list-box.tsx`:
  - `ListBox`, `ListBoxItem`, `ListBoxSection`, and `ListBoxHeader` over react-aria-components, styled like `select.tsx` items;
  - re-exports of `Virtualizer` and `ListLayout`.

  Export it via the package's component path. Verify with a small test in `packages/ui` (sections render, headers are not options, `selectedKeys` marks `aria-selected`) and `pnpm lint` / `pnpm typecheck` in `packages/ui`.

## 5. Search bar and results panel

- [x] 5.1 Styles: extend `workflowSearchStyles` with slots for:
  - `bar` (the current row);
  - `panel`, `filters`, `list`, `groupHeader`, `row`;
  - `rowIndex`, `rowField`, `snippet`, `hit`;
  - `emptyState`, `filterDot`.

  Add variants for `resultsOpen` and `filtered`. Bound the panel height with a container-query unit and a minimum. The root becomes a vertical stack. Use `tv` only. Verify with `pnpm lint` in `packages/flow` (no `cn` import).
- [x] 5.2 In `workflow-search.tsx`:
  - make the counter a `Button` with `aria-expanded`, `aria-controls`, and an accessible name ("Match N of M, show all matches", plus "filtered" when filters are active) that toggles the panel;
  - move `aria-live` into a visually hidden sibling;
  - add the `Aa` / `ab` `Toggle`s with `aria-pressed` and tooltips.

  Verify in `workflow-editor.search.test.tsx`:
  - clicking the counter toggles `aria-expanded`;
  - the live region text updates on next;
  - toggling whole word changes the total.
- [x] 5.3 Add `workflow-search/search-results-panel.tsx`:
  - a source `ToggleGroup` (multiple) with counts; dimmed at zero, still enabled;
  - a sectioned `ListBox` per node (header: kind icon, label, kind title, count; rows: running index, field name, snippet with `<mark>`), virtualized with `Virtualizer` + `ListLayout`;
  - `selectedKeys=[currentKey]`, with `onAction` → `setSearchCurrentMatch`;
  - a scroll-into-view effect keyed on `currentKey` only;
  - `Escape` handled inside the list to refocus the input (propagation stopped);
  - an empty-query hint;
  - a "hidden by filters" state with a Reset action.

  Verify with `search-results-panel.test.tsx` (stubbing element sizes for the virtualizer):
  - groups and numbering match the counter;
  - clicking row 17 → counter `17 / 26`, `onRevealNode` called, selection unchanged;
  - arrowing between rows does not change the current match;
  - Escape refocuses the input and search stays open;
  - reset restores the matches.
- [x] 5.4 Wire `ArrowDown` in the search input to focus the list when the panel is expanded, and keep the panel mounted state in sync with `isResultsOpen`. Verify with a test: ArrowDown focuses the current row, and with the panel collapsed ArrowDown does nothing.

## 6. Stories and end-to-end

- [x] 6.1 Add a `CanvasSearch.stories.tsx` story with many matches across evaluator, tokens, and extractor nodes and the panel expanded. Verify by running Storybook, checking the panel in light and dark themes, and checking that the bar still clears the node palette.
- [x] 6.2 Extend `apps/web/e2e/workflow-canvas-search.spec.ts` with cases for:
  - opening the panel from the counter;
  - clicking a row moves the viewport and the counter;
  - disabling References updates the counter and removes marks;
  - whole word narrows `rate`;
  - the panel stays open after a canvas click.

  Verify that `pnpm exec playwright test workflow-canvas-search` passes.

## 7. Integration check

- [x] 7.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the root. `packages/flow` coverage must stay at or above the 70% threshold. Run `openspec validate workflow-canvas-search-results-panel --strict`. Verify all pass.
