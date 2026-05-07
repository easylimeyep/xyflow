# Design

## Problem Shape

The current failure path is:

```text
ReactFlow drag position update
  -> workflow store writes history.present.nodes
  -> InlineExpressionNode renders
  -> asStringArray(config.template) returns a new array
  -> KeywordExpressionListInput receives a new value prop
  -> rows changes by reference
  -> useEffect copies rows into draftRows
  -> extra render/update during a high-frequency drag stream
```

This combines two issues:

- high-frequency drag updates do more store and derived-cache work than position changes require
- keyword token rows mirror committed props into local draft state through an effect

The fix should separate committed workflow state from temporary UI editing state without introducing another global store.

## Keyword Token State Model

Keep the workflow store as the source of truth for committed keyword tokens. Use local component state only for uncommitted live editor values that are needed for validation display.

Instead of storing a full `draftRows` copy of `value`, render rows from:

```text
committedRows = value.length > 0 ? value : [""]
liveOverrides = Map or Record keyed by row index/row identity
renderedRows = committedRows with matching liveOverrides applied
```

The component should not run `useEffect` to copy `value` into local state. External committed changes are reflected naturally because `committedRows` comes directly from props during render. Local live overrides should be ignored or cleared logically when they no longer match the committed base they were created from.

A simple approach is to store live edit metadata with a base signature:

```ts
type LiveDraft = {
  baseSignature: string
  rowsByIndex: Record<number, string>
}
```

If `baseSignature !== currentValueSignature`, the live draft does not apply. This handles undo/import/add/remove/config updates without a synchronization effect.

## Reference-Stable Normalization

`asStringArray` should avoid allocating a new array when the input is already an array of strings. It can return the original array in that case and only allocate when filtering invalid entries or wrapping a scalar string.

This reduces unnecessary prop changes for components that receive normalized config arrays.

## Drag Path Optimization

Position-only changes do not change expression dependency structure or variable suggestions. During transient drag updates, the store should update node positions and drag-origin history bookkeeping without invoking expression dependency projection/signature work.

The semantic rule is:

```text
position-only node change
  -> may update graph node positions
  -> may update drag history origin/end
  -> must not rebuild expression deps/cache
```

Structural changes, selection-affecting config changes, node/edge add/remove, and config edits should continue to rebuild expression deps/cache when their structural signature changes.

## Zustand Boundary

Do not move keyword live draft text into the global workflow store. The workflow store should contain committed graph/document state and undoable edits. Token text being typed before commit is ephemeral UI state and should remain local.

A component-local Zustand store is possible but unnecessary for this problem. It would not remove the need to model committed-vs-live data and would add more subscription machinery. A local reducer/state object is sufficient if it avoids prop mirroring.

## Tests

Add tests for:

- `asStringArray` returns the same reference for an already-valid string array.
- `KeywordExpressionListInput` can rerender repeatedly with equivalent committed value without triggering repeated state synchronization.
- `KeywordExpressionListInput` still shows live validation for invalid token drafts without committing invalid whitespace tokens.
- add/remove row behavior remains unchanged.
- position-only drag updates keep expression structural version/cache references stable and avoid unnecessary expression recomputation.
- representative large-graph drag performance remains inside the existing frame-safe budget.

## Risks

- Index-keyed live overrides can attach to the wrong row after row removal. Mitigation: invalidate overrides when committed value signature changes, and ensure remove/add tests cover this.
- Skipping expression patch work for position changes must not suppress rebuilds for dimensions or config changes. Mitigation: limit the skip to position-only node changes and keep existing structural paths untouched.
- Removing the effect may expose assumptions in tests that expected `draftRows` to reset after every prop change. Mitigation: assert user-visible committed and live behavior instead of internal state.
