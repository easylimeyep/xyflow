## Context

`ExpressionEditor` currently configures CodeMirror with JavaScript language support plus project-specific template highlighting:

```text
ExpressionEditor
  CodeMirror extensions
    - javascript()
    - template highlighting for {{ ... }}
    - commit behavior

  Custom picker
    - opens from typed {{}}
    - inserts {{ variable }}
```

The JavaScript extension is useful for code-like editing, but these fields are mixed template inputs. A value such as `hello {{ email }}` should read primarily as user-authored text with embedded template references, not as JavaScript source.

The template highlighting layer already parses the actual template boundaries through `parseTemplateSegments()` and applies decorations only to delimiter ranges and known variable bodies. That layer is the right product behavior to preserve.

## Goals / Non-Goals

**Goals:**

- Make ordinary literal text render with default editor foreground styling.
- Keep muted styling for `{{` and `}}` delimiters.
- Keep accent styling for known variable bodies inside closed `{{ ... }}` expressions.
- Keep unknown variable bodies unaccented.
- Preserve CodeMirror as the text editing buffer.
- Preserve validation, commit lifecycle, picker behavior, and editor layout.

**Non-Goals:**

- Remove CodeMirror.
- Change the template language or parser.
- Add JavaScript expression evaluation or semantic JS validation.
- Redesign expression input borders, spacing, wrapping, or picker UI.
- Change workflow node props, store updates, or persisted workflow graph data.

## Decisions

### Decision: Remove the JavaScript language extension from the rendered editor

Do not include `javascript()` in the `extensions` array used by `ExpressionEditor`.

Rationale: the language extension is the source of broad syntax coloring. Removing it lets CodeMirror behave as a plain text editor while the dedicated template decoration extension continues to color only the template ranges we own.

Alternative considered: keep `javascript()` and override CodeMirror token CSS back to the default foreground color. This would be more fragile because future theme/token classes could leak through and the editor would still be configured as a JavaScript buffer.

Alternative considered: make JavaScript highlighting opt-in via a prop. This adds API surface before there is a demonstrated consumer that needs code-mode expression editing.

### Decision: Preserve template highlighting as the only semantic styling

Keep `createTemplateHighlightExtension(variables)` in the extension list.

Rationale: template highlighting was intentionally added for scanability and is scoped to the mixed-template grammar. It also reuses the same parser boundaries as validation, so it avoids drift between what the editor colors and what the expression system understands.

### Decision: Preserve interaction behavior unchanged

Keep commit-on-blur, commit-on-Enter, live validation, external value sync, wheel isolation, and the custom `{{}}` variable picker unchanged.

Rationale: this change is visual/editor-configuration only. It should not change what values are saved, when they are committed, or how variables are inserted.

## Risks / Trade-offs

- Users lose any incidental JavaScript token coloring inside complex expressions. This is intentional for now because the product model is mixed text with template references.
- CodeMirror may still provide editing behavior from `basicSetup`; tests should focus on visible token styling rather than assuming no CodeMirror internals exist.
- If future requirements need full expression-language highlighting, it should be introduced as a deliberate template/expression grammar rather than by reusing generic JavaScript coloring.

## Verification Plan

1. Add or update tests to prove `{{ ... }}` delimiter/body highlighting still produces the expected ranges.
2. Add integration or style coverage showing ordinary literal text is not decorated by JavaScript syntax classes after rendering.
3. Keep existing expression editor integration tests passing for validation, blur commit, Enter commit, picker insertion, and external value sync.
4. Run focused expression editor tests.
5. Optionally verify in the web example by editing a workflow expression input containing mixed literal text and `{{ email }}`.
