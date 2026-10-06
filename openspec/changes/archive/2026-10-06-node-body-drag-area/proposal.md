# Proposal

## Why

Many workflow nodes can only be dragged by their header. Below the header, the whole field block carries `nodrag nopan`, so pressing on a field label such as "Path", or on the empty space between fields, neither moves the node nor pans the canvas. Users expect to grab a node anywhere that is not an editable control, as they can with the header.

## What Changes

- The non-interactive parts of a node body move the node like the header does. That covers field labels, helper text, the gaps between fields, and the padding.
- Interactive controls inside a node never start a node drag or a canvas pan. That covers text inputs, expression editors, select triggers, checkboxes, buttons, popover triggers, and condition drag handles. Users can still select text in a field, open a dropdown, and reorder conditions without moving the node.
- The `nodrag nopan` opt-out moves from the field-block wrappers (`setVariableNodeStyles.root`, `evaluatorNodeStyles.root`, `inlineExpressionNodeStyles.editField`) onto each interactive control, through one shared style.
- Controls that have no opt-out today get it as well. These are the Result node's select and the JSON Evaluator's match-type select. Without it, dragging inside them moves the node.

## Capabilities

### New Capabilities

- `workflow-node-drag-area`: which parts of a workflow node start a node drag and which parts belong to its controls.

### Modified Capabilities

_None._

## Impact

- Styles in `packages/flow/src/styles/components/nodes/`:
  - `set-variable-node.styles.ts`
  - `evaluator-node.styles.ts`
  - `inline-expression-node.styles.ts`
  - a new shared node-control style
- Node components that render fields:
  - extractor, path-extractor, setter-view (set-variable, json-setter)
  - evaluator-view, condition-row, operand-editor, json-evaluator
  - inline-expression and its keyword list input
  - result
- No store, data model, or public API changes. `packages/ui` is untouched; controls receive the class through `className` or a wrapper.
