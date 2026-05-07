## 1. Style contract

- [x] 1.1 Add explicit `cursor: text` styling for the reusable expression editor's CodeMirror editable surface.
- [x] 1.2 Keep React Flow node-level draggable cursor behavior unchanged.
- [x] 1.3 Verify `nodrag nopan` remains on workflow expression field containers and no event handling changes are introduced.

## 2. Regression coverage

- [x] 2.1 Add or update a focused expression editor stylesheet test that asserts the CodeMirror editable surface declares `cursor: text`.
- [x] 2.2 Run expression editor tests that cover style, validation, variable insertion, highlighting, and autocomplete behavior.
- [x] 2.3 Run relevant flow/node tests that cover Keyword token rows and other expression inputs.

## 3. Manual verification

- [ ] 3.1 Open the web example app at `http://localhost:3001/` and switch to `with elk graph`.
- [ ] 3.2 Confirm hovering the Keyword `Tokens` input shows a text cursor.
- [ ] 3.3 Confirm hovering non-input parts of the same node still communicates draggable node behavior.
- [ ] 3.4 Confirm at least one evaluator/extractor/set-variable expression field also shows a text cursor over its editable input.
