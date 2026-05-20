# Move Pointer Position Out Of Store

## What

Remove high-frequency canvas pointer-position writes from the workflow Zustand store while preserving paste-near-cursor behavior.

The change will:

- stop storing `lastPointerFlowPosition` as reactive workflow store state
- keep the latest canvas pointer flow position in a non-reactive ref owned by the editor UI
- pass the current pointer position explicitly to clipboard paste when paste is invoked
- keep the existing viewport fallback anchor when no pointer position is available
- add regression coverage proving hover/pointer movement does not rerender workflow nodes or non-canvas editor UI

## Why

Hovering or moving the pointer over the workflow canvas currently calls `setLastPointerPosition`, which writes new coordinates into the global workflow store. Even though the workflow graph has not changed, every store update causes node-level selectors to run again. Some node selectors return new array references for unchanged data, so React DevTools reports rerenders of whole workflow nodes and their content during hover.

The pointer coordinate is not domain workflow state. It is only a transient UI hint used by `pasteFromClipboard` to place pasted nodes near the cursor. Keeping it in the global store makes a high-frequency UI signal look like reactive graph state and wakes subscribers that should not care about pointer movement.

## Scope

- Move latest pointer flow position storage from workflow store state to an editor-level ref or equivalent non-reactive holder.
- Update paste flow so callers can provide an optional anchor position.
- Preserve current paste behavior: use pointer anchor when available, otherwise use viewport fallback.
- Keep canvas pointer batching if still useful for avoiding excessive coordinate calculations, but do not write each pointer update to Zustand.
- Remove store fields/actions that exist only for pointer-position tracking.
- Add focused tests around paste anchoring and render stability during pointer movement.

## Non-goals

- Redesign the workflow store architecture.
- Remove clipboard copy/paste support.
- Change node placement math for pasted nodes beyond how the anchor is supplied.
- Change quick-add, edge insert, drag, selection, or viewport behavior.
- Fully solve all selector reference-stability issues in this change.
