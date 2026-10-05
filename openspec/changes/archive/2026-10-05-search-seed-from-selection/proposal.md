# Proposal

## Why

`Mod+F` already opens the canvas search from anywhere inside the workflow editor, including expression fields, but the search always starts from an empty (or the previous) query. Selecting a variable in an expression and pressing `Mod+F` should search for it directly, the way text editors seed their find bar from the selection.

## What Changes

- Pressing `Mod+F` with a non-empty, single-line selection in the focused element seeds the search query with the selected text.
- The selection is read from the focused element: a text `input`/`textarea` (by its selection range) or a content-editable region such as the CodeMirror expression editor (by the document selection).
- When the search is already open, a usable selection replaces the current query; without one, `Mod+F` focuses and selects the query as today.
- A selection made inside the search bar's own input never seeds the query.
- Selections that are empty, whitespace-only or span several lines are ignored; the selected text is used as is (no trimming, no stripping of `{{ }}`).
- No change to the expression editor package: it keeps leaving `Mod+F` unbound.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `workflow-canvas-search`: `Mod+F` seeds the query from the focused element's text selection, both when opening the search and when it is already open.

## Impact

- `packages/flow/src/workflow/components/workflow-editor/workflow-editor.tsx` — `WorkflowEditorShell.onKeyDown` seeds the query before opening or focusing the search.
- A small helper in `packages/flow` that reads the focused element's selection and decides whether it is usable.
- Tests in `packages/flow` for the seeding behavior. The expression editor's `search-keymap` test stays as is.
- No public API changes, no new dependencies.
