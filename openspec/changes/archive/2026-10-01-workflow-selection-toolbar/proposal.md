# Proposal

## Why

When the editor is hosted inside a focus-trapping modal dialog (react-aria), clicking a node or the canvas does not move focus onto the canvas. The dialog restores focus to the last focusable element, often a config-panel input or an expression editor. The editing hotkeys (`Ctrl+C`, `Ctrl+D`, `Backspace`) deliberately ignore events from editable targets, so to the user copy, duplicate and delete look broken. The only fallback today is the node context menu, which is not discoverable enough.

## What Changes

- Add a **selection toolbar**: a small floating toolbar anchored to the top-right corner of the bounding box of the selected nodes. It is visible when two or more nodes are selected; a single selected node keeps its commands in the node context menu, so the two surfaces do not duplicate each other.
- The toolbar offers `Copy`, `Duplicate` and `Delete` (destructive). They run the same commands as the node context menu and the hotkeys, against the current selection.
- Each toolbar button has a tooltip with the command name and its keyboard hint.
- The toolbar is hidden in observe mode and while nodes are being dragged.
- The node context menu and the selection toolbar take their commands from a single shared definition, so they cannot drift apart (refactor only; context-menu behavior is unchanged).
- **Canvas focus:** a pointer interaction with a node or with the empty canvas moves keyboard focus onto the canvas container, unless the pointer landed in an editable field. The editing hotkeys then work even inside a focus-trapping dialog.

## Capabilities

### New Capabilities
- `workflow-selection-toolbar`: floating toolbar for the current node selection (visibility, placement, commands, tooltips), plus canvas focus handling that keeps the editing hotkeys reachable when the editor is hosted in a focus-trapping container.

### Modified Capabilities
<!-- None: node context menu requirements are unchanged; it only shares its command definitions with the toolbar. -->

## Impact

- `packages/flow/src/workflow/components/workflow-canvas` — renders the selection toolbar inside `ReactFlow`; the canvas container becomes programmatically focusable.
- `packages/flow/src/workflow/nodes/node-context-menu` — reads its commands from the shared selection-command definition.
- New component folder for the selection toolbar and the shared command definition (`tv` styles, no `cn`).
- Uses `NodeToolbar` from `@xyflow/react` (already a dependency) and `Tooltip` from `@flow/ui`. No new dependencies.
- Interacts with the in-flight `workflow-node-groups` change: a group header sits at the frame's top-left, so the toolbar goes top-right to avoid it.
