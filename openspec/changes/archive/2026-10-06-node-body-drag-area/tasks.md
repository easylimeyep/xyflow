# Tasks

## 1. Shared control style and coverage test

- [x] 1.1 Add `nodeControlStyles` (base `nodrag nopan`) in `packages/flow/src/styles/components/nodes/node-control.styles.ts` and export it from the nodes styles index. Verify `pnpm typecheck` passes.
- [x] 1.2 Add a test that renders each node kind with fields (extractor, path-extractor, set-variable, json-setter, evaluator, json-evaluator, inline-expression, result). It asserts that every `input`, `button`, `[role=combobox]`, `[role=checkbox]`, and `[contenteditable]` in the node body has a `.nodrag` ancestor, and that field labels do not. Watch it fail on the label assertions for nodes that still use the block wrapper.

## 2. Data nodes

- [x] 2.1 Remove `nodrag nopan` from `setVariableNodeStyles.root`. Apply the control style to the controls in extractor, path-extractor, setter-view, and the json-setter footer, using `className` or a wrapper as the design describes. Verify that the coverage test passes for these kinds and that the existing tests under `src/workflow/nodes/data` pass.
- [x] 2.2 Remove `nodrag nopan` from `inlineExpressionNodeStyles.editField`. Apply the control style to the inline-expression checkboxes and to the keyword list input (expression inputs, add and delete buttons). Verify the coverage test and the inline-expression tests pass.

## 3. Logic nodes

- [x] 3.1 Remove `nodrag nopan` from `evaluatorNodeStyles.root`. Apply the control style to the evaluator-view controls (label input, checkbox, sortable list, add button), to condition-row (reorder handle, delete button, selects), and to operand-editor (expression inputs, `ArrayInputPopover`). Verify that the coverage test and the evaluator tests pass.
- [x] 3.2 Apply the control style to the JSON Evaluator match-type select and the Result node select. Verify that the coverage test passes for both kinds.

## 4. Integration check

- [x] 4.1 Run `pnpm vitest run`, `pnpm typecheck`, and `pnpm lint` in `packages/flow` and verify all pass.
- [x] 4.2 In Storybook, verify each spec scenario by hand on the node-groups and evaluator examples:
  - dragging by the "Path" label moves the node;
  - dragging by the gap between fields moves the node;
  - with one node selected, dragging another node by its label moves that node;
  - text selection inside an input does not move the node;
  - text selection inside an expression editor does not move the node;
  - a select opens without moving the node;
  - condition reordering does not move the node.

  Capture a screenshot.

  _Result: everything was checked by hand in the node-groups story except condition reordering. No story turns on multiple conditions, so the reorder handle, delete button, logical-operator select, and add button are covered only by their style slots, which compose the control style. The coverage test does not render them either._
- [x] 4.3 Run `openspec validate node-body-drag-area --strict` and verify it passes.
