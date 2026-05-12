## Why

Keyword token rows use commit-on-blur expression inputs, so the visible row text can be newer than the persisted `template` array. Clicking `Add token` after typing into a row currently appends from the stale committed array and can overwrite the typed first-row value with an empty string.

## What Changes

- Preserve current valid visible token row drafts when `Add token` appends a new empty row.
- Prevent row list actions from silently persisting invalid live token drafts that existing validation deliberately keeps out of node config.
- Add regression coverage for clicking `Add token` immediately after typing into the empty visual row and an existing row.
- Review delete-row behavior for the same live-draft/stale-array boundary and align it if needed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `keyword-tagged-input`: Keyword token list append/remove actions must preserve valid live expression row drafts instead of rebuilding from stale committed config.

## Impact

- Affected UI: `KeywordExpressionListInput` in the workflow Keyword node.
- Affected behavior: `Keyword` token row add/remove interactions while an `ExpressionInput` has uncommitted live text.
- Affected tests: Keyword node component/integration tests around expression input commit-on-blur and token row actions.
- No API, persistence format, backend export, or dependency changes are expected.
