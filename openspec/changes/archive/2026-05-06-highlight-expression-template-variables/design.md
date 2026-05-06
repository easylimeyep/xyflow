## Context

The reusable expression editor already parses template strings through `parseTemplateSegments()`. That parser returns exact source offsets for literal and expression segments, including whether a segment is closed.

The editor currently connects CodeMirror with JavaScript language support, custom autocomplete, line wrapping, and commit handlers. It does not add a view decoration layer for template-specific styling.

Current rendering treats the whole document uniformly:

```text
literal text {{ myVar }} more text
```

Desired rendering separates delimiters from recognized variable bodies:

```text
literal text {{ myVar }} more text
             ^^       ^^ muted
                └───┘    accent when known
```

## Goals / Non-Goals

**Goals:**

- Make known template variable references easier to scan in all expression inputs.
- Reuse the existing template parser so highlighting follows the same `{{ ... }}` boundaries as validation.
- Keep delimiter styling separate from expression body styling.
- Avoid warning/error color for unknown variables in this change.
- Keep the public `ExpressionEditor` and flow `ExpressionInput` API unchanged.

**Non-Goals:**

- Add semantic validation for unknown variables.
- Change autocomplete options or insertion behavior.
- Add hover cards, clickable chips, or variable navigation.
- Redesign expression field layout, sizing, borders, or validation UI.

## Decisions

### Use CodeMirror decorations

Highlighting should be implemented as a CodeMirror extension using `ViewPlugin` and `Decoration.mark`. This keeps styling aligned with the editor document and selection model, including wrapped lines and mixed literal/expression text.

### Reuse prepared variables

The editor already receives a prepared `variables` catalog from consumers. The highlighter should derive a `Set` from `variable.value` and compare it with each expression segment's trimmed body.

Known expression:

```text
{{ myVar }}
```

- `{{` and `}}`: muted delimiter class.
- `myVar`: accent body class.

Unknown expression:

```text
{{ typoVar }}
```

- `{{` and `}}`: muted delimiter class.
- `typoVar`: no accent class.

### Keep incomplete expressions quiet

For incomplete segments such as `{{ myVar`, the opening delimiter may be muted, but no accent body should be applied unless the expression is closed and known. Validation already communicates incomplete expression errors.

## Risks / Trade-offs

- [Decoration drift] A custom regex could disagree with validation boundaries. -> Mitigation: use `parseTemplateSegments()` as the single source of template ranges.
- [Too much visual noise] Heavy chip styling inside a text editor can distract from typing. -> Mitigation: use muted delimiter color and a subtle accent color/background only on known body text.
- [Unknown variable ambiguity] Unknown expressions will not be highlighted as errors yet. -> Mitigation: this is explicitly scoped as a scanability improvement; unknown-variable validation can be explored later.

## Open Questions

- Should a follow-up introduce an "unknown variable" state once the expression system has clear semantics for computed JS expressions versus direct variable references?
