# Design

## Context

React Flow decides at pointer-down whether a node drag may start. In `@xyflow/system`, the d3-drag filter rejects a drag when the target is inside an element with the `noDragClassName` class (default `nodrag`). Text inputs and other form controls get no special treatment, so without `nodrag` a drag inside an input would move the node. `nopan` likewise keeps the canvas from panning.

Today the field blocks of several nodes are wrapped as a whole:

| Style slot | Used by |
| --- | --- |
| `setVariableNodeStyles.root` = `nodrag nopan ...` | extractor, path-extractor, setter-view (set-variable, json-setter) |
| `evaluatorNodeStyles.root` = `nodrag nopan ...` | evaluator-view (evaluator, json-evaluator) |
| `inlineExpressionNodeStyles.editField` = `nodrag nopan ...` | inline-expression |

Other controls have no opt-out at all: the Result node select and the JSON Evaluator match-type select, which is rendered in the evaluator footer outside `root`. Node header actions already use `nodeShellStyles.headerActions` = `nodrag nopan`. The flow package composes classes with `tv` and does not use `cn`.

## Goals / Non-Goals

**Goals:**
- Every non-control pixel of a node body drags the node.
- Every control opts out in one consistent way, so a new field cannot forget it.

**Non-Goals:**
- Changing `packages/ui` primitives. They are generic and do not know about React Flow.
- Making observe-mode nodes draggable. Observe mode keeps its current drag rules.
- Changing the header, handles, or context menus.

## Decisions

### Opt out per control, not per block

Remove `nodrag nopan` from the three block slots. Add it to each interactive control instead.

- Alternative: keep the block wrapper and let labels opt back in. This was rejected because React Flow checks for any `nodrag` ancestor, so a descendant cannot opt back in.
- Alternative: change `noDragClassName` or patch React Flow's filter to skip `input`, `textarea`, `select`, and `[contenteditable]`. This was rejected because it is global, misses composite controls such as select triggers (buttons), popovers, and sortable handles, and is a less visible convention than the class the codebase already uses.

### One shared style for the opt-out

Add a `nodeControlStyles` `tv` style in `styles/components/nodes/` whose base is `nodrag nopan`, and export it from the nodes styles index. Node style files compose it into their control slots, such as the input, select trigger, checkbox, and expression editor slots. When a component renders a control:

- Pass the class through the control's `className` when that prop lands on the element that receives the pointer. This holds for `Input`, `SelectTrigger`, `Checkbox`, and `Button`.
- Otherwise wrap the control in an element with the class. This applies to expression editors, `ArrayInputPopover`, and the sortable condition list or handle, whose internals are not under the node's control.

The existing `headerActions` slot keeps `nodrag nopan` and can compose the shared style for consistency.

### Shared field controls carry the opt-out themselves

`ExpressionInput` adds the control style to the wrapper it already renders around the editor. `WorkflowTypeSelect` adds it to its root. Both are drawn only for node fields, so every use, including `SearchMarkedExpressionInput`, `OperandExpressionInput`, and the array popover rows, is covered without touching each call site. Controls from `packages/ui` take the class through a `control` slot, or through the slot they already style (`optionToggle`, `operatorSelect`, `dragHandle`, and so on).

The node header's `headerActions` keeps its own block opt-out, as the Non-Goals say. The coverage test skips that area when checking labels.

### Coverage by inventory, checked by a test

The inventory of controls inside nodes is:

- extractor: `Input` ×2, `Checkbox`
- path-extractor: `Input`, `Select`
- setter-view: `Input`, expression input, `Checkbox`
- json-setter footer: `Checkbox`
- evaluator-view: `Input`, `Checkbox`, sortable list, `Button`
- condition-row: reorder handle, delete button, `Select` ×2
- operand-editor: expression inputs, `ArrayInputPopover`
- json-evaluator footer: `Select`
- inline-expression: `Checkbox` ×3, keyword list (expression inputs, `Button` ×2)
- result: `Select`
- output quick-add: `Button`

A test renders each node kind and asserts two things:

- Every `input`, `button`, `[role=combobox]`, `[role=checkbox]`, and `[contenteditable]` inside the node body has a `nodrag` ancestor.
- Field labels have no `nodrag` ancestor.

This catches controls that were missed or added later.

## Risks / Trade-offs

- [Risk] A control whose `className` lands on an inner element leaves a few pixels of its border draggable. → Mitigation: the test checks the pointer target, and the control is wrapped when in doubt.
- [Risk] dnd-kit condition reordering and a React Flow node drag could both start. → Mitigation: the reorder handle and the sortable rows keep `nodrag`, and the scenario is checked by hand.
- [Trade-off] Label text can no longer be text-selected with the mouse, because pressing on it drags the node. Labels are static captions, so this is accepted.
- [Risk] A `Label` with `htmlFor` focuses its input on click. A click with no movement still reaches the label, so focus behavior is unchanged; a drag moves the node. → Accepted.
