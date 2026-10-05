# Tasks

## 1. Preview element and styles

- [x] 1.1 Add `preview`, `previewIcon`, `previewTitle` slots to `nodePaletteStyles` (`node-palette.styles.ts`): fixed, parked at `-top-[1000px] left-0`, `pointer-events-none`, opaque background, border, `rounded-md`, small shadow, icon + title row, fixed width; verify `pnpm --filter @flow/flow typecheck` passes
- [x] 1.2 Render one preview element in `NodePalette` as a sibling of the `aside` (outside the scroll list), `aria-hidden`, showing the icon and title of a `draggedKind` local state and empty while it is `null`; add a test that the preview is `aria-hidden`, outside the list, and that cards keep their existing markup, and verify `pnpm vitest run src/workflow/components/node-palette` passes

## 2. Drag start wiring

- [x] 2.1 Write failing tests in `node-palette.test.tsx` (stub `dataTransfer` passed to `fireEvent.dragStart`): drag start calls `setDragImage` with the preview element showing the dragged kind's title and offsets `(0, 0)`, still sets `WORKFLOW_NODE_KIND_MIME` and `effectAllowed = "move"`, and a stub without `setDragImage` does not throw; verify they fail
- [x] 2.2 In `onDragStart`, set `draggedKind` inside `flushSync`, then call `event.dataTransfer.setDragImage?.(previewRef.current, 0, 0)`; reset `draggedKind` on `dragend`; keep the quick-add `preventDefault` early return first; verify the 2.1 tests and the existing "draggable only while no insertion is pending" test pass
- [x] 2.3 Add a test that during quick-add a drag start neither calls `setDragImage` nor sets data; verify it passes

## 3. Integration checks

- [x] 3.1 Run `pnpm --filter @flow/flow lint typecheck test` and verify all pass with coverage at or above the package threshold
- [x] 3.2 Manually verify in Chrome with the palette list scrollable (default window height): dragging any entry shows the opaque chip with icon + title and no stripe on the right, at 100% and 110% zoom; dropping places the node's top-left where the chip's top-left was
- [x] 3.3 Manually verify the drag ghost in Firefox and Safari shows the chip (not blank, not the card); record the outcome in the change

> Manual check (2026-10-05): confirmed by the user in Chrome, Firefox and Safari: the ghost is the chip and the right-edge stripe is gone.
