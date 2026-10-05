# Tasks

## 1. Selection reader

- [x] 1.1 Mark the query input in `workflow-search.tsx` with a `data-workflow-search-input` attribute, and verify `workflow-search` tests still pass
- [x] 1.2 Write failing unit tests in `components/hotkeys/hotkeys.test.ts` for `readSearchSeed`: selection in an `input`/`textarea`, document selection inside the root, document selection outside the root (ignored), empty, whitespace-only, multi-line (`\n`, `\r`), the search input itself (ignored), and `{{ price }}` returned unchanged. Verify they fail
- [x] 1.3 Implement `readSearchSeed(activeElement, root)` in `components/hotkeys/hotkeys.ts` and export it, then verify the 1.2 tests pass

## 2. Seeding from Mod+F

- [x] 2.1 Add failing tests to `workflow-editor.search.test.tsx`: Mod+F with a selection in a label input opens the search with that query; Mod+F with a selection while the search is open replaces the query and selects it; Mod+F with no selection keeps the open query; Mod+F with a partial selection inside the search input keeps the query and selects all of it
- [x] 2.2 In `WorkflowEditorShell.onKeyDown`, call `setSearchQuery(seed)` before `openSearch()` / `focusSearch()` when `readSearchSeed` returns a seed, and verify the 2.1 tests pass
- [x] 2.3 Add an integration test that mounts a real-CodeMirror expression field inside the editor, selects `price`, presses Mod+F and asserts the query is `price`. If jsdom cannot drive the CodeMirror selection, add it as a Playwright e2e case instead. Verify it passes

## 3. Integration checks

- [x] 3.1 Run `pnpm --filter @flow/flow test`, `pnpm --filter @flow/expression-editor test`, `pnpm typecheck` and `pnpm lint`, and verify all pass. `expression-editor.search-keymap.test.tsx` must stay unchanged and green
- [x] 3.2 Manually check in `apps/web`: select a variable in an expression field and press Ctrl/Cmd+F with the search closed, then again with it open. Verify the query is replaced and the matches are revealed
