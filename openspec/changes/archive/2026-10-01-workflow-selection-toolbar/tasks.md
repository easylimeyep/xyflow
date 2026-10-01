# Tasks

## 1. Shared selection commands

- [x] 1.1 Add a `selection-commands` module with the ordered, immutable `copy` / `duplicate` / `delete` definitions (label, icon, shortcut hint, destructive flag, run against store state); verify with a unit test that asserts order, labels, hints and that `run` calls the matching store action
- [x] 1.2 Refactor `NodeContextMenu` to render its items from the shared definitions; verify the existing node-context-menu tests still pass unchanged (`pnpm vitest run src/workflow/nodes/node-context-menu`)

## 2. Selection toolbar component

- [x] 2.1 Lift the search-bar tooltip into a reusable action tooltip (label + shortcut hint) if `SearchActionTooltip` is not already generic; verify the workflow-search tests still pass
- [x] 2.2 Implement `SelectionToolbar` (icon buttons from the shared definitions, separator before destructive, `tv` slot styles, `nodrag nopan`, pointerdown propagation stopped, accessible names); verify with component tests that it renders three named buttons, `Delete` has the destructive variant, and each button fires its store action
- [x] 2.3 Verify with a component test that hovering or focusing a toolbar button shows its label and shortcut hint

## 3. Canvas integration

- [x] 3.1 Render `SelectionToolbar` inside a `NodeToolbar` in `WorkflowCanvas` with `nodeId={selectedNodeIds}`, `position=Top`, `align="end"` and explicit `isVisible`; verify with `workflow-canvas` tests that it is visible for 2 selected nodes and hidden for 0 and for 1 (single node uses the context menu)
- [x] 3.2 Hide the toolbar in observe mode; verify with a canvas test in observe mode that it does not render
- [x] 3.3 Track node and selection drag state locally and hide the toolbar during drag; verify with a canvas test that drag start hides it and drag stop shows it again
- [x] 3.4 Verify with a test that clicking a toolbar button keeps the selection unchanged (no pane click, no deselect)

## 4. Canvas focus handling

- [x] 4.1 Export the editable-target check from `hotkeys.ts` and add a "focusable control" check next to it; verify with unit tests for input, textarea, `.cm-editor`, button and plain div targets
- [x] 4.2 Make the canvas container focusable (`tabIndex=-1`, neutral focus style) and move focus onto it on capture-phase pointerdown for non-editable, non-control targets; verify with a test that clicking a node moves `document.activeElement` to the container and clicking an input inside a node does not
- [x] 4.3 Verify with an integration test that renders the editor inside a react-aria modal dialog: focus an input in the config panel, click a node, press `Ctrl+C`, and assert `copySelectionToClipboard` was called through the clipboard adapter
- [x] 4.4 Fix the node change router swallowing a click that re-selects a node after the store changed the selection on its own (toolbar Delete + undo, duplicate, paste): compare against the selection the nodes carry, not the last emitted one; verify with `use-node-change-router` tests for re-select after an external clear and for no re-emit of an unchanged selection

## 5. Integration checks

- [x] 5.1 Add or update a Storybook story (fullscreen modal example) that shows the selection toolbar, and manually confirm copy, duplicate, delete and the hotkeys work inside the dialog
- [x] 5.2 Run `pnpm lint`, `pnpm typecheck` and `pnpm test` in `packages/flow`; verify they all pass and coverage stays above the 70% threshold
