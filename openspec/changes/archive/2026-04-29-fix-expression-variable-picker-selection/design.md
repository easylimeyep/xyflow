## Context

Expression inputs keep CodeMirror edits local and commit them on blur or Enter. The variable picker opens when the live editor value contains a wrapped trigger such as `{{}}`, and selecting a picker item calls `onChange` immediately with the inserted template expression.

The intermittent failure appears in `KeywordExpressionListInput`, where each row is keyed as `${index}-${rowValue}`. A click on a variable first moves focus out of CodeMirror. The blur handler commits the typed `{{}}` placeholder to parent state, `rowValue` changes, React replaces the row, and the old picker unmounts before `cmdk` can deliver `onSelect`. On the next attempt the stored value is already `{{}}`, so the key may not change and selection appears to work.

## Goals / Non-Goals

**Goals:**

- Keep expression rows stable while their editable value changes.
- Ensure clicking a variable from the picker always inserts it after typing `{{}}`.
- Cover the failure mode with a regression test that includes the list-row wrapper, not only isolated `ExpressionInput`.
- Preserve existing blur/Enter commit behavior and live validation.

**Non-Goals:**

- Replace CodeMirror, Radix Popover, or cmdk.
- Change expression syntax or variable discovery.
- Redesign picker styling, layering, or z-index unless verification reveals a separate visual issue.

## Decisions

- Use stable row identity in `KeywordExpressionListInput`.
  - Prefer a key based on row position plus a persistent row id, or position alone for the current non-reorderable list, instead of `rowValue`.
  - Rationale: editable text must not determine component identity; remounting interactive editors during blur is fragile.
  - Alternative considered: delay blur commit while picker is open. This treats the symptom but leaves value-derived keys able to remount editors for other interactions.

- Keep variable insertion in `ExpressionInput` as the immediate commit boundary.
  - Rationale: selecting a variable is an explicit user action and should continue to call `onChange` immediately.
  - Alternative considered: route variable selection through parent list state. That would spread expression insertion logic into wrappers and duplicate CodeMirror cursor handling.

- Add regression coverage around `KeywordExpressionListInput`.
  - The test should simulate typing `{{}}`, clicking a variable, and assert that the parent receives the inserted expression on the first click.
  - Keep the existing isolated `ExpressionInput` tests because they cover the lower-level insertion and commit contract.

## Risks / Trade-offs

- Stable index-based keys can preserve row state after deletions in edge cases where multiple rows exist. Mitigation: because rows are not reorderable here, use generated row ids if preserving state across add/remove matters, or ensure deletion behavior is covered.
- Preventing remounts may expose stale draft state if a row receives external value changes while focused. Mitigation: keep `ExpressionInput`'s existing external value sync behavior and add focused/list-wrapper tests only around the changed behavior.
- Browser interaction could still be affected by actual overlay stacking. Mitigation: verify in `localhost:3000` after the key fix; only adjust popover classes if a separate z-index/pointer-events issue remains.
