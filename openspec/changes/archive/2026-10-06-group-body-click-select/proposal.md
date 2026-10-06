# Proposal

## Why

Today only the header bar of an expanded group frame takes the pointer. A click elsewhere inside the frame falls through to the empty canvas and clears the selection, and a drag there pans the canvas. The frame looks like one object, but most of its area cannot select or move it. Every other object on the canvas is selected by a click and moved by a drag, and the frame should work the same way.

## What Changes

- The body of an expanded group frame takes the pointer like a node does.
- A click anywhere on the frame's empty area selects the group, the same way a header click does. With a selection modifier (Shift, Ctrl, or Cmd) the click toggles the group in the selection.
- A drag anywhere on the frame's empty area moves the group and its members, the same way a header drag does.
- **BREAKING** (interaction): a plain drag that starts inside a frame no longer pans the canvas. Panning still works from empty canvas outside frames, by scroll or trackpad, and inside a frame in observe mode, where groups cannot be moved.
- A box selection (Shift+drag) can still start inside a frame.
- Member nodes and edges inside a frame are drawn above it and keep their own click and drag behavior.
- Collapsed group cards are unchanged; they are already selected and moved from anywhere on them.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `workflow-node-groups`: three requirements change:
  - "Group frame geometry": the body no longer passes panning through.
  - "Selecting groups": a click on the body selects the group.
  - "Moving a group": a drag on the body moves the group.

## Impact

- `packages/flow/src/workflow/groups/group-canvas-nodes.ts`: the frame node no longer restricts dragging to the header and no longer disables pointer events.
- `packages/flow/src/styles/components/canvas/group-frame.styles.ts`: the frame body takes the pointer and shows a grab cursor in edit mode.
- `packages/flow/src/workflow/components/workflow-groups/group-frame.tsx`: the doc comment changes to match.
- Tests that assert the header-only drag handle.
- No store, data model, or public API changes. Group dragging already exists through the frame node and the group drag logic.
