## Why

On larger workflows there is no way to find a node or a variable except by panning and reading the canvas. Users need an editor-style "find" that shows how many occurrences exist and lets them step through them, including every place a variable is defined or referenced.

## What Changes

- Add an editor-style **canvas search bar**: a query input, an `N / M` match counter, and next/previous navigation (buttons, `Enter`, `Shift+Enter`), closed with `Escape`.
- A match is an **occurrence**, not a node: one node can contribute several matches.
- Phase 1 match sources:
  - the node label (`node.data.label`);
  - a variable definition (the name returned by the node kind's `variable()` reader);
  - variable references inside `{{…}}` templates in the node's expression fields — the same field set the variable rename refactor walks.
- Matching is case-insensitive substring.
- Matches are ordered spatially on the canvas (top-to-bottom, then left-to-right, then by position inside the node).
- Moving to a match reveals its node: the viewport centers on it and raises zoom to a minimum readable level if needed. Stepping through matches does not change the node selection. A separate explicit action selects the current match's node.
- Matching nodes are visibly marked on the canvas; the node holding the current match is marked more strongly.
- The match list is recomputed whenever the graph changes while search is open. The current match is kept by identity (node, source, field, offset), not by index.
- The search opens with `Mod+F` only while focus is inside the workflow editor, and is available in both edit and observe modes.
- The search bar is part of the default editor composition and is exposed as `WorkflowEditor.Search` plus a named export.
- The field walk used by the variable rename refactor is extracted into a shared read-only traversal so rename and search visit exactly the same fields.
- Out of scope for this change (phase 2): highlighting the matched text inside inputs and expression editors, case-sensitive and whole-word toggles, source filters, and a results dropdown.

## Capabilities

### New Capabilities
- `workflow-canvas-search`: an editor-style search over the workflow canvas, covering occurrence matching (labels, variable definitions, variable references), counter and navigation, viewport reveal, on-canvas match marking, live recomputation, hotkeys, and its public composition part.

### Modified Capabilities
<!-- None: compound API exposure of the new part is specified inside workflow-canvas-search; zoom bounds from workflow-viewport-zoom are reused unchanged. -->

## Impact

- `packages/flow/src/workflow/expression/refactor` — the expression-field walk is extracted into a shared traversal. Rename behavior is unchanged.
- `packages/flow/src/workflow/` — a new search module containing a pure match index builder and the search state, kept outside graph history.
- `packages/flow/src/workflow/components/workflow-canvas` — a node-reveal helper built on the existing `setCenter` usage and the workflow zoom bounds.
- `packages/flow/src/workflow/nodes/node-shell` — match and current-match visual states.
- `packages/flow/src/workflow/components/hotkeys` + `workflow-editor` — the `Mod+F` binding, a new `WorkflowEditor.Search` part, and default composition.
- `packages/expression-editor` — its CodeMirror setup stops binding its own `Mod+F` search panel, so the hotkey opens the workflow search from inside expression fields too.
- No new dependencies. The search UI is built from existing `@flow/ui` primitives.
- No persistence, backend, or history changes.
