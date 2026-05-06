## Context

The reusable expression editor is rendered by `ExpressionEditor` from `@workspace/expression-editor`. Its JSX wraps `CodeMirror` inside `styles.editorContainer()`. The wrapper currently applies `overflow-hidden rounded-md border border-input bg-background`, while package-level CSS applies `border: 1px solid var(--flow-editor-border)` directly to `.cm-editor`.

This creates two nested rectangular strokes:

```text
┌──────────────────────────────┐  editorContainer border
│ ┌──────────────────────────┐ │  .cm-editor border
│ │ {{ expression }}          │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

The duplicated border appears anywhere the reusable editor is used, but it is most noticeable in compact expression rows such as Keyword `Tokens`.

## Goals / Non-Goals

**Goals:**

- Render each expression input with one visible border.
- Keep the rounded, clipped control boundary on the outer editor container.
- Preserve CodeMirror sizing, background, text color, cursor color, selection styles, syntax behavior, validation, autocomplete, and variable picker behavior.
- Keep the fix inside the reusable expression editor package so all consumers benefit consistently.

**Non-Goals:**

- Redesign expression input spacing, height, typography, or validation UI.
- Change Keyword token list behavior, add/remove controls, or token validation rules.
- Change public `ExpressionEditor` or flow `ExpressionInput` props.
- Change CodeMirror tooltip borders; autocomplete popovers may keep their own border because they are separate floating surfaces.

## Decisions

### Keep the wrapper as the single input border owner

The expression editor wrapper should remain responsible for the visible input border because it already owns `rounded-md` and `overflow-hidden`. Keeping the border there ensures CodeMirror content clips cleanly to the same radius and stays aligned with other shadcn-style controls.

The `.cm-editor` rule should keep visual editor-specific styling such as font size, background, foreground, and cursor-related colors, but should no longer draw a full control border.

### Do not remove tooltip or gutter borders

The autocomplete tooltip is a separate floating layer and should keep its own border. CodeMirror gutter borders are also unrelated to the doubled input outline; if gutters are disabled for this editor they are not part of the visible issue, and if they appear elsewhere they express an internal editor separator rather than the input shell.

### Preserve behavior before and after the style change

This change is intentionally visual. Tests should focus on guarding the DOM/style contract without coupling to screenshots unless the repo already has a visual regression path. Existing integration tests for commit lifecycle, validation, and variable insertion should continue passing unchanged.

## Risks / Trade-offs

- [Theme mismatch] Removing the `.cm-editor` border changes which token controls border color. -> Mitigation: keep `border-input` on the wrapper, matching the existing design system control pattern.
- [CodeMirror default styles] CodeMirror may still inject outline-like focus styles through generated classes. -> Mitigation: inspect runtime rendering after the CSS change and add an explicit reset only if needed.
- [Over-specific tests] CSS tests can become brittle. -> Mitigation: assert the project-owned style contract at a high level: wrapper owns the border, `.cm-editor` does not.

## Open Questions

- Should focus styling be added to the wrapper in a follow-up so expression inputs match other controls' focus rings? This proposal only removes the duplicate border.
