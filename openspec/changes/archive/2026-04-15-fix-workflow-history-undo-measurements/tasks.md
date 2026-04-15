## 1. Reproduce And Classify History Noise

- [x] 1.1 Add a regression test in `packages/flow/src/workflow/store/store.test.ts` that simulates node add followed by React Flow measurement/layout update and asserts one undo removes the node.
- [x] 1.2 Add or update test coverage for initial canvas mount so measurement/layout updates do not seed undo history before user actions.

## 2. Tighten Node Change Commit Policy

- [x] 2.1 Introduce explicit classification for semantic vs transient node changes in the workflow history policy helpers.
- [x] 2.2 Update `packages/flow/src/workflow/store/slices/graph-slice.ts` so transient measurement/layout updates refresh `history.present` without calling `pushHistoryState`.
- [x] 2.3 Ensure graph projection still preserves runtime node metadata needed by React Flow after transient updates.

## 3. Verify Editor Regressions

- [x] 3.1 Add editor-level regression coverage for `palette add -> undo` so the added node disappears after a single undo.
- [x] 3.2 Run targeted workflow tests covering add/undo, drag history, quick-add, edge insert, and delete flows to confirm existing semantics remain intact.
