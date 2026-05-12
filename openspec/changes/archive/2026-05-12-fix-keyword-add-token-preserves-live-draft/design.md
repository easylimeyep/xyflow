## Context

`KeywordExpressionListInput` renders the Keyword `Tokens` control as a list of `ExpressionInput` rows. Each row follows the expression editor's commit lifecycle: typing updates live UI state, while persisted `template` config updates only on blur, Enter, or variable insertion.

The list component already tracks live row drafts for validation and display. Its add-row action, however, still derives the next template array from the committed `value` prop. When a user types into the first visual row and clicks `Add token`, the click path can first blur/commit the editor and then run `addRow` with the stale array captured by the previous render. For an empty stored template, that stale base is `[]`, so the append update becomes `["", ""]` and erases the typed first row.

The relevant state boundary is:

```text
committed value prop ── persisted Keyword template config
visible rows          ── committed rows overlaid with valid/invalid live drafts
row action base       ── values used when appending/removing rows
```

Row actions must reason from the visible row model, while persistence must still respect keyword token validation.

## Goals / Non-Goals

**Goals:**

- Preserve valid uncommitted keyword token text when appending a new token row.
- Keep invalid live token drafts visible without persisting them through append/remove actions.
- Review row removal for the same stale committed array boundary and align it if needed.
- Add regression tests for `Add token` from the empty visual state and from an edited existing row.

**Non-Goals:**

- Change the generic `ExpressionInput` or `ExpressionEditor` commit lifecycle.
- Persist keyword token rows on every keystroke.
- Change keyword token validation rules, expression syntax validation, or variable autocomplete.
- Change the `template` persistence shape, backend export, undo/redo architecture, or node config APIs.

## Decisions

### Use visible valid rows as the base for row actions

`Add token` should append to the current visible row values, not directly to the committed `value` prop. This keeps the author's active draft intact when the button click happens before React has re-rendered with the blur commit.

Alternative considered: force the blur commit to finish before the button click. This would depend on event timing and still leave row actions coupled to stale props. Using the row model makes the intended source explicit.

### Block append/remove persistence while visible rows are invalid

Keyword rows already reject whitespace-bearing literal/mixed values by showing validation and avoiding `onChange`. Because `rows` includes invalid live drafts for display, row actions must not blindly persist those drafts. If any visible row has a validation error, an append/remove action should leave the invalid value visible and avoid writing a new `template` array until the user fixes the row.

Alternative considered: append from committed `value` whenever a visible row is invalid. That keeps the store clean, but it also recreates the bug shape by letting row actions ignore what the user sees.

### Keep the fix local to Keyword list orchestration

The expression editor is already responsible for focused draft preservation, validation display, and commit events. This issue is specific to how the Keyword list composes live drafts with list-level actions, so the change should stay in `KeywordExpressionListInput` unless implementation evidence shows a reusable primitive is needed.

Alternative considered: add a generic "flush live draft" API to `ExpressionInput`. That would broaden the public API for one list-action race and make every consumer think about draft flushing.

## Risks / Trade-offs

- [Risk] Blocking append on invalid rows could feel like the button did nothing. -> Mitigation: existing row-level validation remains visible; tests should assert no invalid value is persisted.
- [Risk] Index-based live drafts can become ambiguous after removing rows. -> Mitigation: compute the action result from the current visible rows before changing row order, and clear/realign draft state through the resulting committed value.
- [Risk] Tests using a mocked input could miss real blur/click sequencing. -> Mitigation: add at least one integration-style test whose mock preserves the expression editor contract: live typing, blur commit, and stale committed value until parent re-render.

## Migration Plan

No data migration is required. This is a frontend behavior fix for Keyword token row interactions. Rollback is limited to reverting the list orchestration change and regression tests.

## Open Questions

- Should delete-row be blocked when any visible row is invalid, or only when the row being removed or retained would force an invalid value into persisted config? The conservative default is to block persistence while any visible row has a validation error.
