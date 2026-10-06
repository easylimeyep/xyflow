# Tasks

## 1. Make the frame body interactive

- [x] 1.1 In `group-canvas-projection.test.ts`, change the frame assertions so that an expanded frame has no `dragHandle` and no `pointerEvents: "none"` style, and stays `draggable` only in edit mode. Watch it fail, then drop `dragHandle` and `FRAME_STYLE` from `buildGroupCanvasNode` in `group-canvas-nodes.ts` and update its doc comments. Verify the test passes.
- [x] 1.2 In `group-frame.styles.ts`, remove `pointer-events-none` from the frame root and give the root a grab cursor (default cursor when `editable` is false). Remove the drag-handle class from `bar`, and remove `GROUP_FRAME_DRAG_HANDLE_CLASS` if nothing else references it. Update the comments in the styles and in `group-frame.tsx`. Verify with `pnpm vitest run src/workflow` in `packages/flow`.
- [x] 1.3 Check that `pnpm typecheck` and `pnpm lint` pass in `packages/flow`, and that nothing in the repo or the Storybook stories still mentions the old drag-handle class.

## 2. Integration check

- [x] 2.1 In the Storybook "Workflow Examples / Node Groups" story, verify each scenario of the modified requirements by hand:
  - A body click selects the group.
  - A Ctrl/Cmd body click toggles it.
  - A body drag moves the group and its members without panning.
  - A member node click or drag acts on the node only.
  - An edge click inside a frame still works.
  - Shift+drag from the body box-selects.
  - A drag on empty canvas outside frames pans.
  - Dropping a palette node onto a frame body adds it to the group.
  - Right-clicking the body does nothing harmful.

  Capture a screenshot.

  _Result: all checked by hand except the palette drop. That story has no node palette; drop events bubble to the React Flow wrapper, so the frame node does not change that path. Shift+drag was driven with synthetic pointer events, because the browser tool does not hold modifiers during a drag._
- [x] 2.2 Run `openspec validate group-body-click-select --strict` and verify it passes.
