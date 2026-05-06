## Context

`Keyword` is implemented as the `inlineExpression` node kind. The node renders a `Tokens` label and a `KeywordExpressionListInput`, which maps each stored `template` string to an `ExpressionInput` row. The list already stores rows as an ordered `string[]` and relies on `ExpressionInput` for expression syntax validation and variable autocomplete.

The requested behavior is narrower than generic expression editing: the `Tokens` input should accept a single token per row. A row can be either a literal string token or a variable expression token, but whitespace should not allow authors to combine multiple words or mix literal text with a variable inside one row.

## Goals / Non-Goals

**Goals:**

- Prevent users from committing whitespace-bearing keyword token rows.
- Preserve variable insertion/autocomplete for a single `{{ ... }}` expression.
- Keep `Tokens` list add/remove behavior unchanged.
- Keep the implementation local to Keyword unless a reusable `ExpressionInput` extension is clearly simpler.
- Preserve existing invalid stored values visually so users can edit them into a valid form.

**Non-Goals:**

- Change validation rules for other expression inputs.
- Change `template` storage away from `string[]`.
- Redesign keyword matching semantics outside the editor.
- Sanitize or rewrite existing persisted whitespace values during import.

## Decisions

### Validate keyword rows as single-token expressions

Each row should be classified as valid when it is empty, a literal without whitespace, or a single moustache expression whose outer form matches `{{ ... }}`. Literal rows fail if they contain any whitespace character. Mixed rows such as `foo {{ bar }}` fail because they are neither a single literal token nor a single expression token.

Empty rows remain valid because the current list uses empty rows during authoring and when the final token is removed.

### Keep validation at the Keyword wrapper boundary first

The least invasive implementation is to add a small validator inside `KeywordExpressionListInput` and call it before forwarding `onChange`. That keeps generic `ExpressionInput` behavior unchanged for other nodes while enforcing a stricter contract for Keyword tokens.

If the current `ExpressionInput` API already has a validation hook or can expose one cleanly, the wrapper can pass a `validateValue` or equivalent prop instead. The important boundary is still Keyword-specific: other expression fields should continue accepting whitespace when their domain allows it.

### Block invalid edits without losing the current valid row

When a user types or pastes whitespace into a literal token row, the row should show validation feedback and avoid calling `onChange` with the invalid value. This keeps the store free of newly invalid values. For existing persisted invalid rows, rendering should not crash or silently delete data; the UI should show the value and surface feedback until the user edits it to a valid token.

### Permit variable expression whitespace inside braces

Variable expressions commonly contain spaces around the expression body, for example `{{ $input.item.json.email }}`. The whitespace ban applies to the token boundary, not to the conventional formatting inside the expression braces. A value that trims to a single `{{ ... }}` expression should be accepted.

## Risks / Trade-offs

- [Input UX] Hard-blocking a space can feel abrupt. -> Mitigation: show row-level helper/error text so users understand that each row is one token.
- [Variable syntax detection] A naive regex can accidentally allow malformed expressions. -> Mitigation: keep existing `ExpressionInput` syntax validation responsible for expression correctness; the new validator only checks the single-token boundary.
- [Historical data] Old workflows may contain whitespace rows. -> Mitigation: render historical values unchanged and flag them on edit instead of mutating imports.
- [Implementation boundary] Adding validation inside `ExpressionInput` could affect other nodes. -> Mitigation: prefer a Keyword-only wrapper or an opt-in prop.

## Open Questions

- Should paste of `foo bar` be fully rejected, or should it split into two token rows automatically? The safer first implementation is rejection because the request says spaces cannot be entered.
- Should tabs/newlines be treated the same as regular spaces? This proposal treats all whitespace as invalid outside a single `{{ ... }}` expression.
