## Context

`ExpressionEditor` currently configures CodeMirror with two distinct variable assistance mechanisms:

```text
ExpressionEditor
  CodeMirror extensions
    - javascript()
    - autocompletion({ override: [completionSource], tooltipClass: ... })
    - template highlighting
    - line wrapping
    - commit behavior

  Custom picker
    - Radix Popover + Command list
    - opens from typed `{{}}`
    - inserts `{{ variable }}`
```

The custom picker is the intended product surface: it is grouped, searchable, and inserts a complete wrapped expression. CodeMirror autocomplete is lower-level editor behavior. It shows raw completion labels while editing token text and is visually fragile in compact workflow node fields.

The clipping symptom is caused by the current single-border control structure: `editorContainer` uses `overflow-hidden rounded-md border border-input bg-background`. That wrapper is desirable for input shape and border consistency, but it clips CodeMirror tooltip DOM when CodeMirror tries to position autocomplete outside the editor content area.

## Goals / Non-Goals

**Goals:**
- Make the custom variable picker the only visible variable suggestion UI in expression fields.
- Stop CodeMirror autocomplete from opening while users type or correct expression token text.
- Preserve CodeMirror as the text editing buffer.
- Preserve template highlighting for `{{ }}` delimiters and known variables.
- Preserve validation and commit lifecycle behavior.
- Keep expression inputs visually single-bordered and rounded.

**Non-Goals:**
- Redesign the custom variable picker UI.
- Change the template language or expression validation rules.
- Remove CodeMirror itself.
- Add a portal or z-index fix for CodeMirror autocomplete.
- Change workflow variable collection or upstream variable ordering.
- Change stored workflow graph data.

## Decisions

### Decision: Remove the CodeMirror autocomplete extension from the rendered editor

Do not include `autocompletion(...)` in the `extensions` array used by `ExpressionEditor`.

Rationale: the UI already has a custom picker for variable insertion. Removing the CodeMirror extension eliminates the duplicated popup and the clipping bug at the source, without relaxing the editor container's overflow behavior.

Alternative considered: keep CodeMirror autocomplete and portal tooltips to `document.body` with `tooltips({ parent: document.body })`. This would make the internal tooltip visible, but it would preserve two suggestion systems and introduce positioning/z-index behavior that the product UI does not need.

Alternative considered: remove `overflow-hidden` from the editor container. This could reveal the tooltip, but it risks breaking the rounded single-border input shape and still leaves duplicate suggestion UX.

### Decision: Preserve the custom `{{}}` variable picker

Keep `pickerOpen`, `Popover`, `Command`, grouped variables, and `insertVariable` behavior.

Rationale: this picker is intentionally product-shaped. It is searchable, can show descriptions, and inserts the correct wrapped template syntax in one action.

### Decision: Keep pure autocomplete helpers for now

Leave `createExpressionCompletionSource`, `buildExpressionCompletions`, and related tests in place unless the implementation creates dead-code pressure that warrants a separate cleanup.

Rationale: the proposal is about visible editor behavior. Removing exported helpers would be a public API cleanup with a wider blast radius than needed.

## Risks / Trade-offs

- Some users may expect editor-style token completion after partially typing a variable. The custom picker remains available through the `{{}}` insertion flow, but partial-token completion will no longer appear.
- Tests may currently assert CodeMirror autocomplete behavior. Update only tests tied to rendered editor behavior; pure helper tests can remain if the helpers stay exported.
- If future requirements need code-like expression completion, it should be designed as one integrated product surface rather than re-enabling the hidden CodeMirror tooltip.

## Verification Plan

1. Add or update an expression editor integration test showing that normal typing in an existing expression does not render a CodeMirror autocomplete tooltip.
2. Keep or update variable picker coverage proving `{{}}` still opens the custom picker and inserts the selected variable.
3. Run expression editor tests.
4. Run affected flow/evaluator node tests if expression field integration is covered there.
5. Manually verify the web example: `with elk graph` -> `Evaluator` -> edit `{{ email }}` by deleting and restoring `l`; no clipped popover should appear.
