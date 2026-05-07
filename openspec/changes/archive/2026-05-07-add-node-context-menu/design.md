## Context

The workflow editor renders custom nodes through `NodeShell`, with all known node implementations (`InlineExpressionNode`, `SetVariableNode`, `ExtractorNode`, `EvaluatorNode`, and `ResultNode`) using that shell. The shared UI package already provides Radix-backed context menu primitives in `packages/ui/src/components/context-menu.tsx`, including destructive menu item styling and shortcut text support.

The store already has selection state, copy-to-clipboard behavior for selected nodes, paste behavior, undo/redo history, and structural node changes through React Flow `NodeChange` events. Duplicate should reuse the same graph-copy semantics as clipboard paste where practical, but it should not overwrite the user's system clipboard.

## Goals / Non-Goals

**Goals:**
- Add a context menu to every workflow node through the shared node shell.
- Keep menu actions consistent with selection behavior:
  - Right-click selected node -> operate on current selected nodes.
  - Right-click unselected node -> select that node and operate on it.
- Provide menu commands for `Copy`, `Duplicate`, and `Delete`.
- Render kbd hints in the menu:
  - `Copy` -> `Ctrl+C` (existing behavior).
  - `Duplicate` -> `Ctrl+D` (new behavior to implement).
  - `Delete` -> `Backspace`.
- Render `Delete` using the context menu destructive variant.
- Preserve undo/redo behavior for duplicate and delete as one semantic history step per action.
- Add focused tests for store commands, hotkeys, and menu integration.

**Non-Goals:**
- Do not add node-kind-specific menu sections in this change.
- Do not add rename, copy node ID, copy node JSON, or add-connected-node actions yet.
- Do not change edge context menu behavior.
- Do not replace existing keyboard copy/paste behavior.
- Do not write duplicate through the system clipboard.

## Decisions

### Decision: Attach the menu at `NodeShell`

Wrap the rendered node root in `ContextMenu` / `ContextMenuTrigger` so all current node kinds receive the same menu through their existing shell. This avoids duplicating menu markup across custom node components and keeps the feature available for future node kinds that adopt `NodeShell`.

Alternative considered: add a `ContextMenu` to each node component. This was rejected because it would duplicate command markup and increase the chance of inconsistent behavior between node kinds.

### Decision: Use selection-aware targeting

On context-menu open or command selection, resolve the action target from the current selection. If the right-clicked node is selected, use the existing selected node IDs. If it is not selected, set the workflow selection to that node and use only that node.

This matches common canvas/editor behavior and lets multi-select users delete, copy, or duplicate several nodes from one right-click.

### Decision: Implement duplicate as a store command

Add a store-level duplicate command that clones the resolved node set and internal edges, assigns new IDs, offsets positions, deduplicates labels/variable names, selects the duplicated nodes, and pushes a single undo history entry. The command should reuse existing helper logic from selection clipboard/paste where it makes sense, but must not call `copySelectionToClipboard` because that would overwrite the user's clipboard.

### Decision: Keep command labels simple and expose shortcuts as menu hints

Use menu items:

- `Copy` with shortcut text `Ctrl+C`.
- `Duplicate` with shortcut text `Ctrl+D`.
- `Delete` with shortcut text `Backspace`.

`Delete` should use the existing destructive item variant so it appears red in the menu and on focus.

## Risks / Trade-offs

- [Risk] The menu trigger may interfere with controls inside node forms. -> Mitigation: attach it around the shell while relying on Radix context-menu behavior and test right-clicking node content that contains inputs/selects.
- [Risk] Duplicate could diverge from paste semantics. -> Mitigation: extract shared internal helpers for clone/deduplicate behavior instead of reimplementing all naming and edge mapping logic separately.
- [Risk] `Backspace` delete may fire while editing text. -> Mitigation: hotkey handlers should ignore editable targets such as inputs, textareas, selects, and contenteditable elements.
- [Risk] `Ctrl+D` may conflict with browser bookmark behavior. -> Mitigation: only prevent default when workflow duplicate is available and focus is not in an editable element.
