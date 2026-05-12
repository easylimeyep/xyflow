## Context

`ExpressionEditor` is a CodeMirror-backed controlled component exposed through `@workspace/expression-editor`. Its public API is commit-oriented: consumers pass the last committed `value`, live typing can be observed through `onLiveChange`, and persisted state is updated only on blur, Enter, or variable insertion.

The Keyword node renders a `KeywordExpressionListInput` whose rows use `ExpressionInput`. Typing in a row updates local live draft state, but the persisted `template` config can remain unchanged until commit. Toggling `Case sensitive` updates an unrelated boolean config key, commits a new graph state, and re-renders the node with the old committed `template` value. Because the CodeMirror component is rendered with `value={value}`, that unrelated render can overwrite the visible document with the stale committed value.

The important distinction is:

```text
committed value prop  ── persisted workflow config
live editor document  ── what the user is actively typing before commit
```

Unrelated node config updates should not be treated as user intent to replace the live editor document.

## Goals / Non-Goals

**Goals:**

- Preserve an active expression editor's uncommitted live document across unrelated parent re-renders and node config updates.
- Keep the existing commit lifecycle: no persisted config update on every keystroke, commit on blur/Enter, and immediate commit for variable insertion.
- Preserve external value synchronization for real committed value changes such as undo/redo, import/restore, or another store update that changes the expression value.
- Add regression tests that reproduce the Keyword `Case sensitive` toggle reset.

**Non-Goals:**

- Change `caseSensitive` persistence, defaults, backend export, or matching semantics.
- Redesign Keyword token validation, row add/remove behavior, or expression editor styling.
- Replace CodeMirror or change the public expression syntax.
- Persist every keystroke into workflow history.

## Decisions

### Treat focus as the boundary for live draft ownership

While the editor has focus, the CodeMirror document should be the source of truth for the active draft. A parent render with the same committed `value` must not reset the document. When the editor is not focused and `value` changes externally, the editor should synchronize to that new value as it does today.

Alternative considered: commit the row before toggling `Case sensitive`. This would solve the observed click path but would create a narrow workaround in the Keyword node and would not protect other unrelated re-renders such as selection changes, layout updates, or other sibling controls.

### Preserve commit-oriented public API

The implementation should keep `onCommit` as the persisted change callback and keep `onLiveChange` optional. Consumers should not be required to feed live typing back into the `value` prop.

Alternative considered: make `ExpressionInput` fully controlled by live draft state in every consumer. That would spread editor lifecycle concerns into flow nodes and make list rows responsible for behavior that belongs in the reusable editor boundary.

### Test both reusable lifecycle and workflow regression

The reusable editor should have focused coverage for "same committed value plus unrelated re-render does not reset focused draft" and "external value change while unfocused still synchronizes." The flow-level Keyword test should cover the concrete regression: type a token draft, toggle `Case sensitive`, and assert that the visible token text remains unchanged while `caseSensitive` updates.

Alternative considered: only add a Keyword component test. That would lock down the reported bug but leave the reusable editor contract underspecified for other consumers.

## Risks / Trade-offs

- [Risk] Ignoring all `value` prop changes while focused could hide legitimate external changes such as undo triggered during editing. -> Mitigation: distinguish unchanged committed values from changed committed values, and keep explicit external value-change tests.
- [Risk] CodeMirror wrapper behavior can be subtle when its `value` prop and internal document diverge. -> Mitigation: cover the editor with integration tests using the real CodeMirror component, not only mocked input wrappers.
- [Risk] Keyword's local `liveDraft` state uses array identity to decide whether draft rows still correspond to the committed value. -> Mitigation: verify whether the editor-level fix is sufficient first; if Keyword still drops invalid drafts, adjust the row draft identity logic without persisting every keystroke.
- [Risk] A fix that commits on checkbox click would pollute history with accidental expression commits. -> Mitigation: keep the solution inside editor draft preservation rather than changing node option handlers.

## Migration Plan

No data migration is required. The fix is a frontend behavior change inside the expression editing lifecycle. Rollback is limited to reverting the editor/list changes and related tests.

## Open Questions

- Should a focused editor accept external `value` changes that differ from the last committed value immediately, or defer them until blur? The default implementation path should preserve today's external sync where practical while preventing same-value re-renders from overwriting active drafts.
