## Context

`Keyword` is implemented as the `inlineExpression` node kind and currently renders a single `ExpressionInput` bound to `config.template`. That value is typed and validated as a string, reused by workflow persistence codecs, clipboard roundtrips, store config updates, and expression-refactor flows that rename variables inside expression-bearing config fields.

The requested UX introduces a list-oriented authoring model that is specific to `Keyword`: authors need one visible expression row by default, a square plus action to append rows, and a hover affordance to remove individual expressions. Every row must remain a full `ExpressionInput`, so the design cannot degrade expression validation, autocomplete, or history behavior. Because persisted `template` values are currently scalar, the UI change also implies a data-model change.

## Goals / Non-Goals

**Goals:**
- Represent `Keyword` tokens as an ordered array of full expression strings.
- Provide a custom `Keyword`-only list input with add/remove affordances while preserving existing `ExpressionInput` behavior per row.
- Keep domain export/import, clipboard paste, normalization, and graph updates semantically correct for array-backed keyword templates.
- Preserve expression refactors for keyword template entries when upstream names change.

**Non-Goals:**
- Generalize list-based expression inputs for every node kind.
- Change the meaning of `Repeatable` beyond aligning it with multi-token keyword authoring.
- Redesign generic `ExpressionInput` behavior, autocomplete UX, or non-keyword node editing.
- Introduce a separate node kind or graph-level structure for keyword tokens.

## Decisions

### Store `inlineExpression.config.template` as `string[]`

`Keyword` needs ordered, individually editable expression entries. Storing the list directly in node config keeps persistence, undo/redo, and copy/paste aligned with the UI state and avoids introducing a second shadow field.

Alternatives considered:
- Keep `template` as a single string and split/join in the UI. Rejected because separators would be ambiguous, delete/add operations would be brittle, and per-row expression validation would not map cleanly to the stored value.
- Add a new `templates` field while keeping `template` for compatibility. Rejected because it creates duplicated semantics and complicates node-definition contracts, persistence, and output behavior.

### Keep `ExpressionInput` row-level and build a `Keyword`-specific wrapper component

Each keyword row should remain a standard `ExpressionInput` so validation, autocomplete, and commit-on-blur behavior stay consistent with the rest of the editor. A small wrapper component dedicated to `Keyword` can own list rendering, row actions, and hover affordances without changing generic expression editing APIs.

Alternatives considered:
- Extend `ExpressionInput` itself to support array mode. Rejected because the requested UX is node-specific and would overload a reusable primitive with list and card-layout concerns.
- Use the generic schema renderer for repeated fields. Rejected because the node already uses a custom component and the requested hover badge / plus-button interactions are more bespoke than the current schema UI supports.

### Update node-definition validation and normalization to accept string arrays for keyword templates

The persistence and graph engine already trust node definitions for config validation. The `inlineExpression` definition should become the single source of truth for accepting `template: string[]`, with normalization preserving only string entries. This keeps import/export and clipboard handling aligned with the node contract.

Alternatives considered:
- Add one-off conversion logic in mappers or store code. Rejected because it would duplicate schema decisions outside the node definition and violate the Node API v2 direction.

### Refactor expression-bearing config traversal to handle arrays of strings

Rename-triggered refactors currently traverse expression fields assuming string scalar values. To avoid regressions, the refactor layer should treat `string[]` expression fields as collections of expression templates and rewrite each entry independently while preserving order.

Alternatives considered:
- Skip refactors for keyword arrays. Rejected because keyword expressions remain first-class expression inputs and should stay consistent with rename semantics elsewhere.
- Flatten arrays to a single string for refactor processing. Rejected because it reintroduces artificial delimiters and risks corrupting item boundaries.

### Preserve at least one visible keyword row in the editor

The list UI should always render one `ExpressionInput` row. Deleting the last item should collapse back to a single empty row instead of leaving the node without an editable field. This keeps the control discoverable and avoids ambiguous empty-list rendering.

Alternatives considered:
- Allow zero rows and rely on the plus button as the only empty state action. Rejected because it hides the primary editing affordance and adds extra clicks to resume editing.

## Risks / Trade-offs

- [Persistence shape change] Existing workflows may still contain `template` as a string. -> Mitigation: normalize legacy scalar values into a single-item string array during import/normalization paths.
- [Refactor regressions] Variable rename flows may silently stop updating keyword entries if array handling is incomplete. -> Mitigation: update expression-refactor traversal and add focused regression tests for array-backed keyword templates.
- [UI complexity inside node card] Hover badges and per-row actions can make the compact node feel busy. -> Mitigation: keep only the plus button permanently visible, reveal delete affordances on hover, and preserve one consistent row layout.
- [History churn] Multiple per-row interactions could create noisy undo steps. -> Mitigation: reuse existing `ExpressionInput` commit-on-blur/Enter behavior and treat add/remove as explicit single updates.

## Migration Plan

1. Update `inlineExpression` node config contracts to accept legacy string input and normalize it to `string[]`.
2. Ship the custom keyword list input and adapt the node component to read/write array-backed templates.
3. Update persistence, clipboard, and refactor tests to cover both normalized legacy imports and new array-native roundtrips.
4. If rollback is needed before data leaves the editor boundary, revert to scalar storage and join arrays only through an explicit migration patch; otherwise keep backward-compatible import normalization in place.

## Open Questions

- The output path remains `template`; runtime consumers may need a follow-up change if they currently assume a scalar string outside the editor boundary.
- The hover delete badge positioning should be validated visually once implemented to ensure it does not obscure expression validation or autocomplete UI.
