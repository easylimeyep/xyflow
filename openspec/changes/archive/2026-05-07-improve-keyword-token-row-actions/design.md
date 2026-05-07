# Design

## UX Direction

Use a clear separation between row editing and graph traversal:

```text
┌───────────────────────────────┐
│ Keyword                       │
│ Tokens                        │
│                               │
│ [trash] [ {{ myVariable }}  ] │     o──[+ output]
│ [trash] [ token_two       ]   │
│                               │
│ + Add token                   │
│ Repeatable  Case sensitive    │
└───────────────────────────────┘
```

The right edge of a workflow node should remain visually associated with output handles and downstream quick-add. Token-list actions should live inside the node body, where the user is already editing token content.

## Token Row Layout

Each token row should reserve a small left-side action gutter when row deletion is available. This keeps the input width stable when delete visibility changes and avoids a hover-only button overlapping the input or the output side of the node.

The delete affordance can remain subdued until row hover or focus-within, but its reserved space should not appear suddenly. Keyboard users should be able to tab to the delete button when deletion is available, and focus should reveal the button as clearly as hover does.

When deletion is not available, the row should align cleanly without presenting a disabled destructive action.

## Add Token Placement

`Add token` should be a list-level action below all token rows, aligned with the token input column or the list content. It should no longer be rendered as a sibling of the first input row.

This makes the action read as "append another row" rather than "an inline control for this specific token". It also keeps the add action discoverable when more rows exist.

## Implementation Notes

The likely implementation area is:

- `KeywordExpressionListInput` for JSX structure and action placement
- `inlineExpressionNodeStyles` for row layout, action gutter, and button visibility
- existing `InlineExpressionNode` tests for behavior and new assertions around action placement

Prefer reusing existing `Button` variants and Lucide icons. Avoid adding state unless the layout cannot be expressed with CSS and existing row data.

## Tests

Add or update component tests to cover:

- `Add token` renders after the token row list rather than inside the first token row.
- Adding a token still appends an empty row and updates node config as before.
- Deleting a token still removes the intended row.
- Delete controls do not render when node interactivity is disabled.

## Risks

- A left-side delete gutter may make the row feel slightly wider or denser. Mitigation: keep the gutter compact and visually quiet.
- Moving `Add token` below the list changes muscle memory. Mitigation: keep the visible label and icon clear, and place it immediately after the rows.
