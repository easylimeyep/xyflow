## Why

Workflow nodes remain draggable as whole surfaces, so React Flow correctly marks each draggable node with a `grab` cursor. However, expression fields embedded inside those nodes are text-editing controls. In Keyword token rows and other workflow expression fields, hovering the CodeMirror-backed input can still show the inherited draggable-node `grab` cursor, which conflicts with the user's expectation that text inputs show a text insertion cursor.

The workflow should keep the convenient drag-anywhere node behavior, while reusable expression inputs should explicitly communicate text-editing affordance anywhere inside their editable CodeMirror surface.

## What Changes

- Keep workflow nodes draggable by their full node body.
- Add an explicit text cursor contract to the reusable expression editor's CodeMirror surface.
- Ensure expression editor text-editing regions override React Flow's draggable-node cursor without changing drag behavior outside the input.
- Preserve existing `nodrag nopan` event isolation, editor sizing, border, validation, variable picker, commit lifecycle, highlighting, and autocomplete behavior.
- Add regression coverage so the text cursor contract is not lost when expression editor styles change.

## Capabilities

### Modified Capabilities

- `reusable-expression-editor-package`: Expression editor visual behavior guarantees a text cursor over editable CodeMirror input surfaces, including when rendered inside draggable React Flow nodes.

## Impact

- Affected code is expected in `packages/expression-editor/src/style.css`, with focused CSS/style tests in `packages/expression-editor/src/style.test.ts`.
- Workflow node dragging, React Flow node configuration, persisted workflow data, expression parsing, and store behavior should not change.
- Manual verification should inspect Keyword token rows on the `with elk graph` example and at least one non-Keyword expression field.
