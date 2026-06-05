## Context

`KeywordExpressionListInput` separates committed keyword config from local live row drafts. When `value` is empty, the component derives one visual row from `EMPTY_KEYWORD_ROWS = [""]` so authors always have an editable input.

That visual placeholder currently leaks into committed state in two paths:

- clearing an existing persisted row updates the row to `""` and persists `[""]`
- adding from the empty visual state persists the visual row plus another empty row

The node definition already defaults `template` to `[]`, and empty keyword lists are semantically represented by an empty array. The fix should preserve the one-empty-row authoring UX while preventing empty UI placeholders from entering the store.

## Goals / Non-Goals

**Goals:**

- Ensure committed `Keyword` `template` config never stores empty string entries from interactive token editing.
- Preserve one visible empty `ExpressionInput` row when no keyword tokens are stored.
- Preserve existing validation behavior for whitespace-bearing invalid rows and valid single expression tokens.
- Add focused regression coverage for clearing tokens and row actions from empty visual state.

**Non-Goals:**

- Redesign generic `ExpressionInput` behavior.
- Change keyword token matching semantics for non-empty tokens.
- Change Root, Repeatable, or Case sensitive keyword options.
- Introduce backend export-only cleanup as the primary fix.

## Decisions

### Normalize committed keyword token arrays in the keyword list component

Add a small helper in `KeywordExpressionListInput` that converts visible or edited row arrays into persisted config arrays by removing empty string entries before calling `onChange`.

Rationale: the bug originates at the UI-to-store boundary where the component maps visible rows back into committed config. Keeping the normalization local makes the distinction explicit:

```text
visible rows:     [""]
persisted config: []

visible rows:     ["lead", ""]
persisted config: ["lead"]
```

Alternative considered: filter empty tokens during backend/domain export. Rejected because the store would still contain placeholder data, and downstream consumers inside the editor could continue to observe `[""]`.

Alternative considered: make `applyUpdateNodeConfigCommand` call node definition normalization for every config update. Rejected for this change because it is broader than the defect and could alter unrelated node update behavior.

### Keep empty visual rows as display-only state

Continue deriving a single empty row from `value.length === 0`, but ensure row actions and row edits persist only normalized non-empty rows.

Rationale: existing specs require a blank keyword node to show one editable row. The fix should change persistence, not authoring affordance.

### Preserve invalid live drafts without persisting them

Do not pass invalid whitespace-bearing rows through the new normalizer path. Existing row error checks should continue to block row actions and `updateRow` commits while leaving the invalid value visible for correction.

Rationale: empty strings are valid UI placeholders; whitespace-bearing rows are invalid token values. The implementation should keep those cases distinct.

## Risks / Trade-offs

- [Risk] Existing tests may assert that adding a token from the empty visual state persists `["", ""]`. -> Mitigation: update the expectation to the new persisted invariant and assert the UI still renders editable rows after empty state.
- [Risk] Filtering all empty rows may remove intentionally blank entries from imported historical data after user interaction. -> Mitigation: this is desired for committed edits; existing invalid historical non-empty rows should still render so authors can correct them.
- [Risk] A component-only helper does not protect direct store calls from tests or future code. -> Mitigation: add regression coverage around the component behavior that caused the defect; broader store-level normalization can be considered separately if another path starts committing empty keyword tokens.
