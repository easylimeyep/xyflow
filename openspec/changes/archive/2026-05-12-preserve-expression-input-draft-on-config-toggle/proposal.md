## Why

Editing a Keyword token can lose the user's uncommitted expression text when the user toggles an unrelated node option such as `Case sensitive`. The expression editor has a commit-oriented API, so live typing must remain visible and intact across unrelated parent re-renders until the user explicitly commits, blurs, or an external value change should replace it.

## What Changes

- Preserve the live expression editor draft when unrelated node config changes re-render the parent node.
- Keep existing commit behavior unchanged: typing does not persist on every keystroke, while blur, Enter, and variable insertion still commit.
- Keep external value synchronization for real committed value changes such as undo/redo or store updates.
- Add regression coverage for the Keyword `Case sensitive` toggle so it does not reset a partially typed token.

## Capabilities

### New Capabilities

### Modified Capabilities

- `expression-input-commit-lifecycle`: Clarify that uncommitted live editor drafts SHALL survive unrelated parent re-renders and node config updates.

## Impact

- Affected code is expected in `packages/expression-editor/src/components/expression-editor/expression-editor.tsx` and possibly the flow wrapper/list integration under `packages/flow/src/workflow/components/expression-input/` and `packages/flow/src/workflow/nodes/data/inline-expression/`.
- Tests should cover the reusable expression editor lifecycle and the Keyword node interaction that triggered the regression.
- No persisted workflow schema, public node config keys, backend export shape, or `caseSensitive` semantics should change.
