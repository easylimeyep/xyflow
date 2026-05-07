## 1. Store Commands

- [x] 1.1 Add a workflow store command for duplicating selected or provided node IDs without touching the system clipboard.
- [x] 1.2 Ensure duplicate copies internal edges between duplicated nodes, generates new IDs, offsets positions, deduplicates labels/variable references, selects duplicated nodes, and creates one undo history entry.
- [x] 1.3 Add or expose a context-targeted delete path that removes the resolved node set with one undo history entry.
- [x] 1.4 Preserve existing `copySelectionToClipboard` behavior for `Copy`.

## 2. Hotkeys

- [x] 2.1 Confirm `Ctrl+C` continues to copy selected nodes.
- [x] 2.2 Implement `Ctrl+D` to duplicate the current node selection.
- [x] 2.3 Confirm or implement `Backspace` to delete the current node selection.
- [x] 2.4 Ensure workflow hotkeys ignore editable targets inside nodes.

## 3. Node Context Menu UI

- [x] 3.1 Wrap workflow node renderers with the shared context menu primitives from `packages/ui/src/components/context-menu.tsx`.
- [x] 3.2 Render `Copy` with kbd hint `Ctrl+C`.
- [x] 3.3 Render `Duplicate` with kbd hint `Ctrl+D`.
- [x] 3.4 Render `Delete` with kbd hint `Backspace` using the destructive/red menu item variant.
- [x] 3.5 Apply actions to the current selection when right-clicking a selected node.
- [x] 3.6 Select and target only the clicked node when right-clicking an unselected node.

## 4. Regression Coverage

- [x] 4.1 Add store tests for duplicate behavior, label deduplication, internal edge copying, selection of duplicated nodes, and undo/redo.
- [x] 4.2 Add hotkey tests for `Ctrl+D` duplicate and `Backspace` delete, including editable-target guards.
- [x] 4.3 Add component tests that the node context menu renders all three commands with shortcut hints and destructive delete styling.
- [x] 4.4 Add integration coverage for right-click target semantics with selected and unselected nodes.

## 5. Validation

- [x] 5.1 Run the focused workflow store and workflow canvas/component tests.
- [x] 5.2 Run the relevant package lint/typecheck command if available.
- [x] 5.3 Manually inspect the canvas: right-click each node kind, use Copy, Duplicate, Delete, and verify `Ctrl+C`, `Ctrl+D`, and `Backspace` behavior.
