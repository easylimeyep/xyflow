# Design

## Context

`Mod+F` is handled in one place: `WorkflowEditorShell.onKeyDown` on the editor root. Keydowns bubble up to it from any focused element in the editor. The expression editor deliberately leaves `Mod+F` unbound (`basicSetup.searchKeymap: false`, covered by `expression-editor.search-keymap.test.tsx`), so the key bubbles from expression fields as well. The handler calls `openSearch()` when the search is closed and `layout.focusSearch()` when it is open. The search store already exposes `setSearchQuery`, which resets the current match. See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**
- Seed the query from the selection in whatever element has focus when `Mod+F` arrives, with one code path for inputs and expression fields.

**Non-Goals:**
- Seeding from the word under the caret when nothing is selected.
- Normalizing the seed (trimming, stripping `{{ }}`, length limits).
- Any change to `@flow/expression-editor` or its keymap.

## Decisions

### The host reads the selection from the focused element

At keydown time the handler reads the selection from `document.activeElement`:
- `HTMLInputElement` / `HTMLTextAreaElement`: `value.slice(selectionStart, selectionEnd)`. `window.getSelection()` does not report text selected inside form controls.
- Anything else (CodeMirror's `contenteditable`): `window.getSelection()?.toString()`. This applies only when the selection's anchor is inside the root element, so a stray selection elsewhere on the page is ignored.

**Alternative considered:** the expression editor reports its selection itself, through a prop or a custom event carrying `view.state.selection.main`. That would be more precise and could support "word under the caret", but it adds a contract to the package and still needs the input branch for plain fields. Seeding uses only the explicit selection, so the DOM read is enough. Within a focused CodeMirror view, the DOM selection follows the editor state.

### The selection is read and validated in a pure helper

The selection is read and validated by a small helper, for example `readSearchSeed(activeElement, rootElement): string | null`, placed next to `isSearchHotkey` in `components/hotkeys/`. It returns `null` for an empty selection, a whitespace-only selection, a selection containing `\n` or `\r`, or a selection inside the search bar's own input. Otherwise it returns the text unchanged. The shell handler stays a few lines long:

```
seed = readSearchSeed(...)
if seed != null: setSearchQuery(seed)
isOpen ? focusSearch() : openSearch()
```

### The search input is detected by a data attribute

The search input gets a data attribute, for example `data-workflow-search-input`. The helper checks it, so it does not depend on DOM structure or React refs. This works whether the search is floating or portaled into the toolbar, because the portal still sits under the editor root. If it did not, Mod+F would not reach the shell anyway.

### The query is set before opening or focusing

`setSearchQuery` runs first, inside `flushSync`. The input must already show the seeded value before `focusSearch` selects it: an open search would otherwise have its old value selected, and rendering the new value afterwards moves the caret to the end. `WorkflowSearch`'s open effect and `focusSearch` then select the input's text, so the seeded query ends up fully selected and the next keystroke overwrites it. Setting the query resets the current match to the first one, which is what `setSearchQuery` already does for a typed query.

## Risks / Trade-offs

- [The DOM selection could lag CodeMirror's state] → The read happens on a keydown inside the focused view, where CM6 has already synced the DOM selection. An integration test with real CodeMirror covers this.
- [Selecting `{{ price }}` seeds a query that may match nothing, because references are matched inside the segment] → Accepted for now (see the spec scenario "Selected text is used as is"). Normalization can be added later without changing the approach.
- [jsdom has limited selection support for `contenteditable`] → Unit-test the helper with inputs and a stubbed `getSelection`. Cover the expression field path with a real-CodeMirror test in flow, or in e2e if jsdom cannot drive it.
