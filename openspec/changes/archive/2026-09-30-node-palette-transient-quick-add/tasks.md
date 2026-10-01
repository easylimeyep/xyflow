# Tasks

## 1. Derive palette visibility in the layout provider

- [x] 1.1 In `WorkflowEditorLayoutProvider` (`workflow-editor.tsx`), delete the effect that calls `setIsPaletteOpen(true)` on `quickAddActive`, compute `isPaletteVisible = isPaletteOpen || quickAddActive`, and add it to the layout context value; verify `pnpm typecheck` passes in `packages/flow`
- [x] 1.2 Add `isPaletteVisible` to the public `WorkflowLayout` interface and `useWorkflowLayout()` return, and reword the `isPaletteOpen` doc comment as the user's open choice; verify with a `workflow-editor.test.tsx` case: close palette → start quick-add → hook reports `isPaletteOpen=false`, `isPaletteVisible=true`
- [x] 1.3 In `WorkflowEditorPalette`, render `NodePalette isOpen={(open ?? layout.isPaletteOpen ?? true) || quickAddActive}`; verify with tests: (a) toggle-closed palette becomes `data-state="open"` on quick-add and returns to `closed` after picking a kind, (b) returns to `closed` after Escape cancel, (c) same for edge-insert, (d) `open={false}` host palette still opens during quick-add, (e) an open palette stays open after quick-add

## 2. Toggle and search clearance follow intent

- [x] 2.1 Confirm the built-in toggle's `aria-label`, icon rotation and click all read/write `isPaletteOpen`; add a test: closed palette + pending quick-add → toggle label is "Show node palette", click keeps quick-add pending, picking a kind leaves the palette open
- [x] 2.2 Keep `WorkflowEditorSearch besidePalette` bound to `isPaletteOpen` and add a test in `workflow-editor.search.test.tsx` that the search root's classes do not change when a quick-add transiently shows a closed palette
- [x] 2.3 In `node-palette.styles.ts`, add a compound variant `placement: "floating"` + `quickAddActive: true` that stacks the aside above the floating search (`z-30`); verify in Storybook with search at `top-right` that the borrowed palette covers the search bar and the search does not move

## 3. Click-only palette during insertion

- [x] 3.1 In `NodePalette`, set card `draggable={!quickAddActive}` and skip setting drag data when an insertion is pending; verify with `node-palette.test.tsx`: cards have `draggable="false"` with `quickAddActive`, `"true"` without, and clicking a card still calls `onAddNode`

## 4. Docs and examples

- [x] 4.1 Update `apps/storybook/stories/workflow-examples/provider-layout-example.tsx` to show `isPaletteVisible` alongside the host toggle (e.g. a small status indicator) and verify the story renders and the host toggle pins a borrowed palette
- [x] 4.2 Append a note to `packages/flow/docs/adr/0008-provider-and-shell-are-separate-seams.md` describing the `isPaletteOpen` (intent) vs `isPaletteVisible` (on screen) split; verify the listed hook shape matches `WorkflowLayout`

## 5. Integration check

- [x] 5.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` for `packages/flow` and confirm all pass with coverage at or above the package threshold
- [x] 5.2 Manually in the web app or Storybook: close palette → "+" on node → pick kind → palette hides; close palette → "+" on edge → Esc → palette hides; close palette → "+" → toggle → pick → palette stays open

## 6. Review follow-ups

- [x] 6.1 In `NodePalette`, record the previously focused element when a quick-add focuses the palette and, on an open → closed transition with focus inside the palette, restore it (or the closest `[data-workflow-editor-root]` when disconnected); verify with `node-palette.test.tsx` cases for: return to the prior element, fallback to the editor root, no move when focus is outside the palette, and a pinned palette keeping focus
- [x] 6.2 Add `workflow-editor.test.tsx` cases for an edge-insert on a closed palette: picking a kind hides the palette, and Escape hides it; verify both pass
- [x] 6.3 Extend the search clearance test in `workflow-editor.search.test.tsx` to assert the borrowed floating palette carries the stacking class above the search; verify it passes
- [x] 6.4 Re-run `pnpm lint`, `pnpm typecheck`, and `pnpm test` in `packages/flow` and confirm all pass

