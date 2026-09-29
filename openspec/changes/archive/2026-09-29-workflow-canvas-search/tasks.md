# Tasks

## 1. Shared expression-field traversal

- [x] 1.1 Extract a read-only `forEachExpressionField(registry, node, visit)` from `expression/refactor/refactor.ts`. It must yield `{ fieldPath, template }` in deterministic field order and cover expression-ui text/textarea fields, `renameConfigKey`, `extraExpressionConfigKeys` and structured values such as evaluator conditions. Add unit tests for field coverage and order. Verify by running `pnpm vitest run` on the new test.
- [x] 1.2 Rebuild the variable rename on top of the traversal, with no behavior change. Verify that the existing `refactor.test.ts` passes unchanged.

## 2. Match index (pure, TDD)

- [x] 2.1 Define the `SearchMatch` type (`key`, `nodeId`, `source`, `fieldPath`, `occurrence`, `start`, `end`). Implement `buildSearchMatches(nodes, registry, query)`:
  - matches labels, variable definitions from `variable()`, and references inside `{{…}}` segments only;
  - case-insensitive substring matching;
  - an empty or whitespace query returns `[]`.

  Verify with unit tests for every spec scenario under "Canvas search matches occurrences across labels and variables".
- [x] 2.2 Implement the spatial ordering: `position.y`, then `x`, then source rank, then field order, then `start`, with node id as the tie-break. Verify with a test where creation order differs from canvas order, plus an overlapping-positions test.
- [x] 2.3 Implement `reconcileCurrentMatch(prevKey, prevSortTuple, nextMatches)`. It keeps the current match by key, otherwise moves to the nearest following match, otherwise the first, otherwise `null`. Verify with unit tests covering the spec scenarios "Edits elsewhere do not shift the current match" and "Current match is removed".

## 3. Search state

- [x] 3.1 Add a search slice outside `history` to the workflow store: `isOpen`, `query`, `currentKey`, the last sort tuple, and the actions `open`, `close`, `setQuery`, `next`, `prev` (with wrap-around). Verify with store tests that the actions never change `history` or `nodes`, and that the undo stack is unchanged.
- [x] 3.2 Add selectors:
  - memoized `matches`, recomputed only while search is open, and not during a node drag (recompute when `nodeDragOriginGraph` clears);
  - `currentIndex` and `total`;
  - `useNodeSearchStatus(nodeId)` returning `"none" | "match" | "current"`.

  Verify with tests showing recomputation after graph edits and reconciliation of the current match.
- [x] 3.3 Add a `selectCurrentMatch` action that calls `setSelectedNode` once. Verify with a store test that next/prev leave `selectedNodeIds` untouched and `selectCurrentMatch` sets it.

## 4. Canvas reveal and node marks

- [x] 4.1 Add a `MIN_READABLE_ZOOM` constant (0.8) and a `revealNode(nodeId)` helper next to the minimap `setCenter` logic:
  - centers on the node's measured center;
  - uses zoom `max(current, MIN_READABLE_ZOOM)`, clamped to the workflow zoom bounds;
  - duration 200 ms.

  Expose it through the editor layout context. Verify with a canvas test asserting the `setCenter` arguments for a zoom below the threshold and for a zoom above it.
- [x] 4.2 Add a `searchState` variant (`none | match | current`) to the `NodeShell` `tv` styles. Pass it from `useNodeSearchStatus` in the node renderers, including `DefaultNodeRenderer`. Use `tv` only, no `cn`. Verify with `node-shell.test.tsx` covering all three states.
- [x] 4.3 Add a render-count test: moving the current match within one node, and moving it between two nodes, re-renders only the nodes whose status changed. Verify that the test passes.

## 5. Search bar UI, hotkey and composition

- [x] 5.1 Build the `WorkflowSearch` bar from `@flow/ui` primitives: input, `N / M` counter, zero-results state, previous/next buttons (disabled with no matches), a "select node" button and a close button. `Enter` / `Shift+Enter` / `Escape` are handled on the input only, and each current-match change calls `revealNode`. Verify with component tests for the counter, wrap-around, disabled state and the Escape-closes-and-clears-marks scenario.
- [x] 5.2 Add the `Mod+F` handler on the editor root element, not `window`:
  - `preventDefault` when handled;
  - opens the search, or focuses and selects the query if it is already open;
  - registered in both edit and observe modes.

  Verify with hotkey tests for inside the editor, outside the editor (not handled), and observe mode.
- [x] 5.3 Set `searchKeymap: false` in the expression editor's `basicSetup`. Verify with a test that `Mod+F` inside an expression field opens the workflow search and not the CodeMirror panel.
- [x] 5.4 Mount the search over the canvas (top-right, clear of the open palette) in the default composition — inside `WorkflowEditor.Canvas`, not a React Flow `<Panel>`; see design §7. Expose it as `WorkflowEditor.Search` and as a named export from the flow package entrypoint. Verify with compound API tests for the default composition and for a custom composition with `Canvas` + `Search`.
- [x] 5.5 Add a Storybook story (a large graph with repeated variable names) that demonstrates search. Verify it by running Storybook and checking the counter, navigation and marks in both themes.

## 6. Integration

- [x] 6.1 Add a Playwright e2e spec in `apps/web/e2e`: press `Mod+F` on the canvas, type a variable name, check the `N / M` counter, step with Enter/Shift+Enter, confirm the viewport moved and the node selection did not change, close with Escape. Verify that the spec passes locally.
- [x] 6.2 Run `pnpm lint`, `pnpm typecheck` and `pnpm test` (including `store.performance.test.ts`), and check that the `flow` coverage threshold still holds. Verify that all of them are green.
