# Design

## Context

An expanded group is drawn as a `groupFrame` React Flow node with `selectable: false`. Its z-index puts it under edges and nodes. Today two things keep the body inert:

- The node carries `style: { pointerEvents: "none" }` and `dragHandle: ".workflow-group-drag-handle"`, both in `group-canvas-nodes.ts`.
- The frame root in `group-frame.styles.ts` has `pointer-events-none`, and only the header bar (`pointer-events-auto`, the drag-handle class) and the resize handles opt back in.

A header click already reaches `onNodeClick` in `useGroupCanvasProjection`, which selects the group, or toggles it with a modifier. A header drag already moves the group and its members through the frame node's drag changes.

## Goals / Non-Goals

**Goals:**
- The whole expanded frame behaves like a node: a click selects it and a drag moves it.
- Reuse the existing header paths for selection and moving; add no new selection or drag logic.

**Non-Goals:**
- Opening the group context menu from the body. It stays on the header.
- Renaming by double-clicking the body. It stays on the header.
- Changing collapsed cards.

## Decisions

### Let the body take the pointer instead of hit-testing pane clicks

The first version of this change kept the body transparent and hit-tested `onPaneClick` against group rectangles. That covers clicks, but a drag on the body would still pan, and the user wants it to move the group like every other node. Making the frame node interactive gives both the click and the drag through React Flow's normal node handling. The hit-test code was reverted.

Concretely:
- `buildGroupCanvasNode` drops `dragHandle` and the `pointerEvents: "none"` style for the frame. The whole frame becomes the drag area, and buttons and the rename input keep `nodrag`.
- The `groupFrame` root style drops `pointer-events-none`. The `editable` variant gives the root a grab cursor in edit mode and a default cursor otherwise.
- `GROUP_FRAME_DRAG_HANDLE_CLASS` is deleted if nothing else uses it.

### Box selection and edges keep working

- React Flow starts a box selection in the pane's `onPointerDownCapture` whenever the selection key is held, even over a node ("to be able to create a selection above a node or an edge"). Shift+drag from the body therefore still box-selects.
- Edges and member nodes render above the frame (negative z-index), so they get the pointer first.

### Observe mode

In observe mode the frame is not draggable (`draggable: editable`). React Flow adds the `nopan` class only to draggable nodes, so a drag on the body pans the canvas there, as the spec asks. A click still selects the group, as a header click does today.

## Risks / Trade-offs

- [Trade-off] A plain drag that starts inside a frame no longer pans in edit mode. Users pan from outside frames, by scroll or trackpad (`panOnScroll`), or zoom out. This is the requested behavior.
- [Risk] With large frames, empty canvas becomes harder to reach for a pane click or a drag-pan. → Accepted; it matches how nodes behave. Revisit only if users complain.
- [Risk] Dropping a palette item onto a frame body or ending a connection drag over it might behave differently now that the frame catches the pointer. → Check both in the story. Drop events bubble to the React Flow wrapper, and connection targets are handles, so neither should change.
- [Risk] Right-clicking the body no longer reaches the pane. The app wires no pane context menu, so nothing is lost. → Checked in task 2.
