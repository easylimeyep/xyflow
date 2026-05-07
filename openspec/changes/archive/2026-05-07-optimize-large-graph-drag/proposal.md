# Optimize Large Graph Drag

## What

Improve large workflow canvas drag responsiveness and remove the `Maximum update depth exceeded` failure seen when dragging nodes for several seconds in the `with large elk graph` example.

The change will:

- make `Keyword` token rows render from stable committed values plus local live edits without syncing props into local state through an effect
- preserve stable array references when normalizing already-valid string-array config values
- avoid expression dependency/cache recomputation during position-only drag updates
- add regression and performance coverage for the large-graph interaction path

## Why

Dragging a node in the large ELK example emits frequent React Flow `position` changes. Each change currently updates the workflow store, re-renders canvas nodes, and still runs expression dependency patch logic even though node position does not affect expression variables.

At the same time, `InlineExpressionNode` normalizes `config.template` into a fresh array on render. `KeywordExpressionListInput` then derives `rows` from that prop and uses `useEffect` to copy rows into `draftRows`. Under a sustained drag render stream, this prop-to-state synchronization creates repeated updates from `KeywordExpressionListInput.useEffect`, causing jitter and eventually React's maximum update-depth guard.

The editor should remain responsive while dragging large graphs, and keyword token editing should not rely on an effect that mirrors committed store data into local draft state.

## Scope

- Refactor keyword token list rendering to avoid prop-to-state synchronization effects.
- Keep live token validation while preserving commit-on-blur/Enter behavior from `ExpressionInput`.
- Keep keyword config persistence as ordered `string[]` values.
- Preserve expression variable suggestions, variable insertion, add/remove token behavior, and disabled-interactivity behavior.
- Make string-array normalization reference-stable when no normalization is needed.
- Skip expression dependency/cache rebuild work for position-only node changes that cannot affect expression variables.
- Add or update unit/component/performance tests for the update-depth regression and drag path.

## Non-goals

- Replace the workflow store architecture.
- Move per-keystroke input draft state into the global workflow Zustand store.
- Change ELK layout algorithms or routing.
- Change React Flow's controlled-node model.
- Redesign the full node UI.
- Change exported workflow document shape.
