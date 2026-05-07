## Why

Workflow nodes currently rely on toolbar controls, hotkeys, and canvas affordances for common editing actions. Users who work directly on the canvas expect right-click actions on nodes, especially for destructive and clipboard-style commands. A node context menu makes common node operations discoverable without replacing the existing hotkeys.

## What Changes

- Add a right-click context menu to workflow nodes using the existing `packages/ui/src/components/context-menu.tsx` primitives.
- Show universal node actions:
  - `Copy` with kbd hint `Ctrl+C`; this should invoke the existing selection copy behavior.
  - `Duplicate` with kbd hint `Ctrl+D`; this shortcut and action need to be implemented.
  - `Delete` with kbd hint `Backspace`; this should remove the target node or active node selection and render as destructive/red.
- When right-clicking a node that is already part of the current selection, actions apply to the full selected node set.
- When right-clicking a node that is not selected, select that node first and apply actions to that single node.
- Add regression coverage for menu rendering, command wiring, selection semantics, duplicate behavior, and keyboard shortcuts.

## Capabilities

### New Capabilities
- `workflow-node-context-menu`: Defines node right-click menu behavior and its copy, duplicate, and delete commands.

### Modified Capabilities
- `workflow-canvas-selection`: Context-menu targeting depends on the workflow selection model.

## Impact

- `packages/flow/src/workflow/nodes/node-shell/node-shell.tsx`: Wrap node shells with the shared context menu trigger/content.
- `packages/flow/src/workflow/store`: Add or expose commands for duplicate and context-targeted node actions while preserving undo/redo history.
- `packages/flow/src/workflow/components/hotkeys`: Add `Ctrl+D` duplicate handling and confirm existing `Backspace` delete handling or implement it if missing.
- `packages/flow/src/workflow/components/workflow-canvas` and node tests: Cover menu behavior and command wiring.
- No new UI dependency is expected because the context-menu component already exists in `packages/ui`.
