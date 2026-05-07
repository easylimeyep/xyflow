## Context

The workflow canvas imports React Flow's default stylesheet in `packages/flow/src/style.css`. React Flow marks draggable nodes with a rule equivalent to:

```css
.react-flow__node.draggable {
  cursor: grab;
}
```

That rule is appropriate for the node shell because the desired UX is still drag-by-whole-node. Keyword token inputs are nested inside those draggable nodes:

```text
ReactFlow draggable node
└── InlineExpressionNode
    └── editField: nodrag nopan
        └── KeywordExpressionListInput
            └── ExpressionInput
                └── ExpressionEditor
                    └── CodeMirror
```

`nodrag nopan` prevents React Flow drag and pan interactions from starting on the input, but it does not define pointer cursor semantics. The reusable expression editor currently styles CodeMirror colors, caret color, selection, highlighting, and tooltip surfaces, but does not explicitly set `cursor: text` for the editable CodeMirror surface.

## Goals / Non-Goals

**Goals:**

- Keep drag-by-whole-node behavior outside interactive expression inputs.
- Show a text insertion cursor over the expression editor's editable CodeMirror surface.
- Keep the fix inside the reusable expression editor package so all workflow expression fields benefit consistently.
- Preserve existing editor behavior: `nodrag nopan`, commit-on-blur, commit-on-Enter, variable insertion, validation, highlighting, single-border styling, and custom variable picker.
- Add focused regression coverage for the stylesheet contract.

**Non-Goals:**

- Introduce node header-only dragging or drag handles.
- Globally remove React Flow's draggable-node `grab` cursor.
- Change workflow node drag, selection, connection, or pan/zoom behavior.
- Redesign expression input spacing, focus rings, typography, borders, or validation layout.
- Change public `ExpressionEditor`, `ExpressionInput`, or workflow node props.

## Decisions

### Keep React Flow node drag cursor as the node-level affordance

The workflow editor should continue to communicate that nodes can be dragged. Removing `.react-flow__node.draggable { cursor: grab; }` globally would make the canvas less discoverable and would also fight upstream React Flow semantics.

### Let the expression editor own text cursor semantics

The reusable editor should declare `cursor: text` on the CodeMirror elements that represent the editable input surface. The likely target selectors are `.cm-editor`, `.cm-scroller`, and `.cm-content`, because pointer hover may land on wrapper/editor/scroller/content depending on whitespace, line wrapping, or CodeMirror DOM structure.

This is preferable to patching Keyword node styles because the same embedded-editor problem can occur in evaluator, extractor, and set-variable fields.

### Preserve event isolation separately from cursor styling

`nodrag nopan` remains responsible for interaction routing inside React Flow. Cursor styling should not be used as a proxy for event behavior. The implementation should only add cursor CSS and should not change React Flow `nodesDraggable`, node `draggable`, `dragHandle`, `noDragClassName`, or input event handling.

## Risks / Trade-offs

- [Selector breadth] Styling too many CodeMirror descendants could override cursor affordances for future embedded widgets. -> Mitigation: limit the rule to the editor/scroller/content surface and avoid styling popover command items or unrelated controls.
- [False confidence from CSS tests] A stylesheet test can prove the contract exists but not actual browser hover behavior. -> Mitigation: pair CSS coverage with manual verification in the web example.
- [Drag affordance ambiguity] Keeping drag-by-whole-node means non-input areas still show `grab`. -> Mitigation: inputs explicitly show `text`, controls keep their own cursor semantics, and drag outside controls remains discoverable.

## Open Questions

- Should expression editor focus styling be revisited in a separate proposal so it visually matches other shadcn-style controls? This proposal only addresses hover cursor semantics.
