# Design

## Context

- Copy, duplicate and delete already exist as store actions: `copySelectionToClipboard`, `duplicateNodes`, `deleteNodes`. The node context menu (`nodes/node-context-menu/node-context-menu.tsx`) and the window-level hotkey hooks in `workflow-editor.tsx` both call them.
- The hotkey handlers in `components/hotkeys/hotkeys.ts` ignore events whose target is editable (`input`, `textarea`, `select`, contenteditable, `.cm-editor`). That rule is correct and stays.
- The ReactFlow pane is not focusable. When the editor sits inside a react-aria modal (`FocusScope contain`), a click on the canvas leaves focus where the dialog puts it, which is often an editable field. So the hotkeys are skipped. See proposal.md - Why.
- Selection lives in the store (`selectedNodeIds`) and is projected onto the ReactFlow nodes. Observe mode comes from `useRuntimeMode()`.

## Goals / Non-Goals

**Goals:**
- One floating toolbar per selection, placed by xyflow and not by hand-written bounding-box maths.
- A single command definition shared by the context menu and the toolbar.
- Hotkeys reachable after any pointer interaction with the canvas, whatever the host container.

**Non-Goals:**
- A paste button. Paste needs a target position and is not a selection command.
- Toast or other success feedback for copy. Clipboard error reporting stays as it is.
- Changing the editable-target rule in `hotkeys.ts`.

## Decisions

### Toolbar via `NodeToolbar` with a node-id array
Render one `<NodeToolbar nodeId={selectedNodeIds} isVisible={visible} position={Position.Top} align="end">` as a child of `ReactFlow` in `WorkflowCanvas`.
- `NodeToolbar` accepts `string[]` and positions itself against the combined bounds of those nodes. It also tracks pan, zoom and node movement.
- With several selected nodes the default visibility logic hides it (it only shows for a single selected node), so `isVisible` is always passed explicitly: `selectedNodeIds.length >= 2 && !isObserving && !isDragging` (`MIN_NODES_FOR_SELECTION_TOOLBAR`).

### Toolbar only for a multi-node selection
A single selected node already has `Copy` / `Duplicate` / `Delete` in its context menu; showing the toolbar as well duplicated it on every node click (usually made to open the config panel). The hotkey problem in dialogs is fixed by the canvas focus handling, so a single node does not need the buttons. The toolbar therefore starts at two selected nodes, typically a rectangle or modifier-click selection.
- *Alternative:* compute `getNodesBounds` and render inside `ViewportPortal`. Rejected because it re-implements what `NodeToolbar` already does.
- *Alternative:* attach a toolbar inside every node. Rejected because it creates N toolbars for N selected nodes.

### Top-right placement
`align="end"`, so the toolbar does not collide with the group header that `workflow-node-groups` draws at the frame's top-left.

### Drag state
Track dragging locally in `WorkflowCanvas` via `onNodeDragStart` and `onNodeDragStop` (and the selection-drag equivalents), not in the store. It is transient UI state with no history or persistence meaning.

### Shared selection commands
Add a `workflow/selection-commands/` module (neutral, so `nodes/` does not depend on a canvas component) that exports an ordered, immutable list:
`{ id: "copy" | "duplicate" | "delete", label, icon, shortcut, destructive, run(state) }`.
Separators are derived from `destructive` (the destructive group renders after a separator).
- `NodeContextMenu` maps the list to `ContextMenuItem`s.
- `SelectionToolbar` maps it to icon buttons wrapped in tooltips.
- The hint strings come from the same list, so `Ctrl+C`, `Ctrl+D` and `Del / Backspace` cannot drift between the two surfaces.

### Tooltips
Reuse the existing `SearchActionTooltip` pattern. If it is generic enough, lift it into a shared `ActionTooltip` and use it in both places. Styles go through `tv` slots; `cn` is not used in `packages/flow`.

### Toolbar must not steal canvas gestures
Mark the toolbar root with the `nodrag nopan` classes; React Flow's pan/drag listeners are native, so these classes are the actual guard. The toolbar is not inside the pane, so a press on it is never a pane click. The root also stops React-tree propagation (it is portaled, but React events still reach the canvas wrappers that own it); react-aria buttons already do this themselves.

### Toolbar semantics
The root is `role="group"` with an accessible name, not `role="toolbar"`: the ARIA toolbar pattern implies a single tab stop with arrow-key navigation, which the toolbar does not implement.

### Focus after a toolbar command
`SelectionToolbar` takes an `onAfterCommand` callback; the canvas passes one that focuses its container. Without it, Delete unmounts the toolbar together with the focused button: focus drops to the body, or, inside a react-aria modal, `FocusScope` moves it to the first tabbable element of the dialog (often a text field), and the hotkeys stop working again.

### Canvas focus on pointer interaction
- Give the canvas container `tabIndex={-1}` and a visually neutral focus style (no outline ring on pointer focus).
- On `pointerdown` in the capture phase on the container, if the target is inside the container's DOM box (React events from overlays portaled out of a node also reach this handler), the initial layout is not pending, and the target is not editable and not inside an interactive control (`button`, `a[href]`, `label`, `summary`, control and menu roles such as `button`, `checkbox`, `combobox`, `menuitem*`, `option`, `radio`, `slider`, `switch`, `tab`, inputs, `.cm-editor`, contenteditable), call `container.focus({ preventScroll: true })`.
- Generic `[tabindex]` elements are deliberately *not* excluded: React Flow's node wrappers carry `tabindex`, and excluding them would turn the fix off for exactly the node clicks it exists for.
- The check reuses the editable-target logic from `hotkeys.ts` (`isEditableEventTarget`, now exported) plus `isInteractiveEventTarget` next to it.
- This sits alongside the existing editor-root handler (`WorkflowEditorShell`), which only pulls focus when it is *outside* the editor. A config-panel field is inside the editor, so that handler alone left focus in the field; the canvas handler runs after it in the capture phase and moves focus onto the canvas.
- react-aria's `FocusScope` allows this: the container is inside the scope, so focus stays contained and is no longer restored to the previous input.
- *Alternative:* listen on `document` instead of `window` for hotkeys. Rejected because the event target is still the editable field, so the root cause stays.

## Risks / Trade-offs

- [Drag state is event-driven: switching to observe mid-drag tears down React Flow's drag handler, so no drag-stop arrives] → the flag is reset on every mode switch.
- [Focusing the container on pointerdown could blur a field the user wants to keep editing] → Only non-editable, non-control targets move focus; a click on another field focuses that field as usual.
- [A toolbar above a selection at the top of the viewport is clipped] → Same behavior as any `NodeToolbar`; the user pans. No special handling.
- [Overlap with the `workflow-node-groups` header if that change later moves its header] → Placement is a single `align` prop, cheap to change.
