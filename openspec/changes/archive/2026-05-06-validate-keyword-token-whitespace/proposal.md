## Why

`Keyword` currently renders `Tokens` as a list of full `ExpressionInput` rows. That allows authors to type free-form template content, including whitespace-separated text such as `foo bar` or mixed literal/variable strings such as `foo {{ value }}`. For keyword token matching, each row should represent exactly one token: either a plain string token or a pasted/selected variable expression. Spaces inside a row create ambiguous token boundaries and make the list model harder to reason about.

## What Changes

- Add keyword-token-specific validation for each `Tokens` row.
- Reject token rows that contain whitespace outside the supported variable-expression syntax.
- Allow a plain literal token with no spaces, for example `email` or `customer_id`.
- Allow a single variable expression token, for example `{{ $input.item.json.email }}`.
- Surface validation feedback on the affected row and avoid persisting invalid whitespace-bearing token values.
- Keep existing add/remove row behavior, autocomplete, repeatable toggle placement, and array-backed storage.

## Capabilities

### Modified Capabilities

- `keyword-tagged-input`: Keyword token rows validate as single token values rather than arbitrary multi-token text.

## Impact

- Affected code is expected in `packages/flow/src/workflow/nodes/data/inline-expression/keyword-expression-list-input.tsx`, possibly `packages/flow/src/workflow/components/expression-input/*` if the validation is better exposed through the reusable input, and `packages/flow/src/workflow/nodes/data/inline-expression/component.test.tsx`.
- Existing persisted keyword templates remain compatible; invalid historical rows should still render so users can correct them, but new edits should not commit whitespace-bearing values.
- Requires focused component tests for blocked space typing/paste behavior and allowed variable insertion.
