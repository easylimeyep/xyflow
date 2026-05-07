# Improve Keyword Token Row Actions

## What

Rework the `Keyword` node token-list controls so row editing actions no longer compete with the node output affordance on the right edge.

Move token deletion into a reserved row-action gutter beside each token input, and move `Add token` out of the first row into a dedicated action below the token list.

## Why

The current `Keyword` token row places `Add token` on the right side of the first input while the node's output quick-add affordance also lives on the right edge of the node. When a token row is hovered, the delete action appears even closer to the output area. This clusters three different intentions in one small region:

- edit the token list
- delete a token row
- continue the workflow from the output handle

Separating row actions from graph output actions makes the node easier to scan, reduces accidental clicks near the output affordance, and follows the canvas convention that the right edge of a node is primarily for downstream flow actions.

## Scope

- Render token delete actions in a consistent row-action gutter that is visually separate from the node output edge.
- Render `Add token` as a dedicated list-level action below the current token rows.
- Keep the existing token add/remove behavior and config updates.
- Preserve current expression editing, validation, variable picker, and history commit behavior.
- Add regression coverage for the new action placement and existing add/remove behavior.

## Non-goals

- Change `Keyword` config shape or persistence semantics.
- Change output handle or quick-add behavior.
- Add token reordering, drag handles, or bulk token actions.
- Redesign the full node shell layout.
