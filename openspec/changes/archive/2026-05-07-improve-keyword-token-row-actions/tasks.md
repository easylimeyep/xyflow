# Tasks

- [x] 1. Update Keyword token row layout
  - [x] 1.1 Move token delete controls into a reserved row-action gutter away from the node output edge.
  - [x] 1.2 Keep delete controls visible on row hover and focus-within without shifting input layout.
  - [x] 1.3 Preserve disabled-interactivity behavior for delete controls.

- [x] 2. Move Add token to a list-level action
  - [x] 2.1 Remove the inline first-row `Add token` button.
  - [x] 2.2 Add a dedicated `Add token` action below the token rows.
  - [x] 2.3 Preserve current append behavior for empty and non-empty token lists.

- [x] 3. Add regression coverage
  - [x] 3.1 Assert the `Add token` action is rendered outside individual token rows.
  - [x] 3.2 Assert adding a token still appends an empty row and updates keyword config.
  - [x] 3.3 Assert deleting a token still removes the intended row.
  - [x] 3.4 Assert delete controls remain hidden or unavailable when node interactivity is disabled.

- [x] 4. Verify UX in browser
  - [x] 4.1 Inspect `Keyword` on `http://localhost:3001/` and confirm the right edge is reserved for output quick-add.
  - [x] 4.2 Hover and focus token rows and confirm delete affordances do not overlap or visually compete with output quick-add.
  - [x] 4.3 Confirm text, controls, and token inputs remain aligned with one and multiple token rows.
