## 1. Editor wrapping behavior

- [x] 1.1 Remove `EditorView.lineWrapping` from the reusable expression editor's CodeMirror extension list.
- [x] 1.2 Ensure long logical expression lines remain on one visual row and scroll horizontally inside the editor.
- [x] 1.3 Keep real newline characters rendered as additional vertical editor lines.
- [x] 1.4 Keep line numbers disabled for compact expression fields.
- [x] 1.5 Prevent wheel and trackpad scroll gestures over expression editors from panning the workflow graph.
- [x] 1.6 Hide visible horizontal scrollbar chrome while preserving horizontal scroll behavior.

## 2. Styling contract

- [x] 2.1 Ensure the CodeMirror scroller owns horizontal overflow without leaking content outside the rounded input wrapper.
- [x] 2.2 Preserve the wrapper as the single visible input border owner.
- [x] 2.3 Preserve existing cursor, highlighting, selection, background, and tooltip styles.
- [x] 2.4 Mark the editor surface with React Flow's `nowheel` convention and stop wheel event propagation from the editor container.
- [x] 2.5 Add cross-browser scrollbar hiding styles for the CodeMirror scroller.

## 3. Regression coverage

- [x] 3.1 Add or update expression editor tests for no soft wrapping / horizontal overflow behavior.
- [x] 3.2 Add or update coverage confirming real multiline content remains supported.
- [x] 3.3 Add or update coverage confirming editor wheel events do not bubble to a parent canvas.
- [x] 3.4 Add or update coverage confirming scrollbar chrome is hidden while overflow remains scrollable.
- [x] 3.5 Run expression editor tests that cover style, validation, variable insertion, highlighting, autocomplete behavior, and commit lifecycle.
- [x] 3.6 Run relevant flow/node tests for Keyword token rows and other expression inputs.

## 4. Manual verification

- [x] 4.1 Open the web example app and inspect a Keyword `Tokens` expression row.
- [x] 4.2 Enter a long single-line expression and confirm it uses horizontal scrolling rather than visual wrapping.
- [x] 4.3 Enter a real multiline expression with the supported multiline shortcut and confirm real lines remain visually distinct.
- [x] 4.4 Confirm scrolling over the expression editor does not pan the workflow graph.
- [x] 4.5 Confirm blur commit, Enter commit, custom variable picker insertion, validation, and rounded single-border rendering still behave normally.
