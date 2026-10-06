# Tasks

## 1. Group-scoped layout

- [x] 1.1 Write failing tests in `layout/elk-group-arrange.test.ts` with a stub ELK engine: a chain A → B → C placed out of order ends up ordered left to right; the members' bounds top-left is unchanged; the frame equals `fitToContents` of the moved members; non-members and other groups are untouched; an edge to an outside node is not passed to the engine; a missing, collapsed, or empty group returns the same graph reference; a no-move layout returns the same graph reference
- [x] 1.2 Implement `computeGroupArrangeLayout` in `layout/elk-group-arrange.ts` (design D1), export it from `layout/index.ts`, and verify the 1.1 tests pass
- [x] 1.3 Add one test that runs the real ELK engine on a small group (no stub) and asserts no two members overlap, and verify it passes

## 2. Store action

- [x] 2.1 Write failing store tests in `store/store.groups.test.ts`: `arrangeGroup` moves members and fits the frame in one history entry (one undo restores positions and rect); a graph edit made while the layout is pending makes it drop the result and return `false`; an engine error sets `lastError` to `AUTO_LAYOUT_FAILED` and leaves the graph unchanged; it is a no-op for collapsed or empty groups (observe mode is gated in the UI, the store has no mode)
- [x] 2.2 Replace `fitGroupToContents` with `arrangeGroup(groupId): Promise<boolean>` in `store/types.ts` and `store/slices/group-slice.ts` (design D2), and verify the 2.1 tests pass
- [x] 2.3 Remove `applyFitGroupCommand` from `graph-engine/group-commands.ts` and `graph-engine/index.ts` and its cases from `group-commands.test.ts`, move the old "fit" row in `store.groups.test.ts` to `arrangeGroup`, and verify `pnpm --filter @flow/flow typecheck` and `pnpm --filter @flow/flow test` pass

## 3. Header button

- [x] 3.1 Update `workflow-groups.test.tsx`: an "Arrange" button replaces "Fit to contents"; pressing it calls the arrange flow and the frame ends fitted; it is disabled for an empty group and while pending; it is absent in observe mode. Verify the tests fail first
- [x] 3.2 Swap the button in `group-frame.tsx` (label, tooltip, icon, handler, pending state) per design D3, with styles through the existing `tv` slots, and verify the 3.1 tests pass

## 4. Integration

- [x] 4.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` from the root and verify all pass with `flow` coverage at or above its threshold
- [x] 4.2 In the running web app, put a few connected nodes into a group out of order, press "Arrange", and confirm the members line up, the frame fits, outside nodes stay put, and one undo restores the previous layout (screenshot before and after)
