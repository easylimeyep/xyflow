## Context

`ExpressionInput` is a CodeMirror-backed component used in four node types. In three of them (`extractor-node`, `set-variable-node`, `inline-expression-node`) it is wrapped by `InlineEditField`, which holds a local `draft` state and commits to the Zustand store only on blur or Enter. This pattern was intended to produce a single undo history entry per editing session.

The problem: `InlineEditField` switches its display from `draft` to `storeValue` on blur, but the parent component (which owns `storeValue` as a prop) hasn't re-rendered yet with the committed value. During this brief window, `ExpressionInput` receives a stale `value` prop. Meanwhile `@uiw/react-codemirror` v4 has a typing-protection mechanism (`typingLatch`, 200ms) that defers external `value` prop changes while the user is typing. When it detects `value ≠ currentDoc AND isTyping`, it stores a `forceUpdate` closure (capturing the stale `value`) in `pendingUpdate.current`. When the latch expires, this stale closure fires and overwrites CodeMirror's content.

## Goals / Non-Goals

**Goals:**
- Eliminate the stale-value revert bug structurally, not with timing patches
- Preserve one undo history entry per editing session
- Keep live validation errors visible while typing
- Remove `InlineEditField` as it has no other usages

**Non-Goals:**
- Changing undo/redo granularity for non-expression fields (variable name, token number inputs)
- Modifying `@uiw/react-codemirror` internals
- Adding collaborative editing support

## Decisions

### Decision: Move commit lifecycle into ExpressionInput

**Chosen**: `ExpressionInput` calls `onChange` only on blur or Enter, using CodeMirror extensions to detect these events. The parent wires `onChange` directly to `updateNodeConfig`.

**Alternative considered — fix InlineEditField with `flushSync`**: Wrap `commitDraft()` in `flushSync` inside `onBlurCapture` to force synchronous parent re-render before switching display mode. This eliminates the stale prop window. Rejected because it treats the symptom (timing) rather than the architecture (two buffers). It also requires `flushSync` in both blur and Enter handlers, and still leaves InlineEditField as a fragile coupling layer.

**Alternative considered — `updateNodeConfigLive` (replacePresentGraphState)**: Call store on every keystroke but replace present instead of pushing to history, committing a real history entry on blur. More invasive (requires new store action, explicit "finalize" call), and the commit boundary is less clear. Rejected in favour of the simpler approach of just deferring `onChange`.

**Rationale**: A single buffer (CodeMirror's own internal state) is simpler than two. `@uiw/react-codemirror`'s `typingLatch` was designed for exactly this pattern: hold external updates at bay while the user types, then apply them when done. By not sending `onChange` on every keystroke, we never create a conflicting `value` prop, so `typingLatch` never misfires.

---

### Decision: commitRef pattern for CodeMirror extensions

**Chosen**: A mutable `commitRef` holds the latest commit callback. The CodeMirror extensions (`focusChange` listener, `keydown` handler) reference only `commitRef.current`, so they can be created with empty deps (`useMemo(... , [])`) and remain stable across renders without stale-closure risk.

**Rationale**: CodeMirror extensions registered via `StateEffect.reconfigure` on every render are expensive. Stable extensions that read from a ref are idiomatic for integrating React callbacks with imperative APIs.

---

### Decision: liveValue state for validation

**Chosen**: `ExpressionInput` keeps a `liveValue: string` state, updated via `handleEditorChange` on every CodeMirror change. `validateTemplateExpression` and `{{}}` trigger detection use `liveValue`, not the `value` prop. A `useEffect` syncs `liveValue` back from `value` when the prop changes externally (undo/redo).

**Alternative considered — validate against `value` prop only**: Simpler but shows validation errors only after blur (stale). Not acceptable UX.

**Alternative considered — ref instead of state**: A `useRef` wouldn't trigger re-renders, so validation errors wouldn't update live. Rejected.

---

### Decision: Variable insertion still commits immediately

**Chosen**: `insertVariable` continues to call `props.onChange` immediately after dispatching the insertion to CodeMirror. This is correct because variable insertion is a discrete action (not continuous typing) and should create its own undo entry.

## Risks / Trade-offs

- **Undo granularity between fields**: If the user edits field A, then edits field B without any other action in between, both edits share the same undo step (no `commitGraphState` separates them). Undo from field B's state jumps back to before field A was typed. This is acceptable — it matches the behaviour the user expects from a "session" model, and the alternative (explicit finalize-on-blur store action) adds complexity for minimal gain.

- **Enter key inside CodeMirror**: The Enter handler calls `blur()` on the editor view DOM node, which triggers the blur extension, which would call `commitRef.current()` a second time. The second call is a no-op: `currentDoc === value` at that point (the first commit already updated the store and caused a re-render). Guard with `if (currentDoc !== value)` inside the commit callback.

- **Component unmount without blur**: If the node is removed while ExpressionInput has focus (e.g., deleting the node), the editor is destroyed without a blur event. The typed value would be lost without committing. This is acceptable — deleting a node is a destructive action and the user doesn't expect the typed-but-uncommitted value to survive.

## Migration Plan

1. Update `ExpressionInput` (new exports, new props if needed — the external API `{ value, onChange, variables, placeholder }` stays identical).
2. Remove `InlineEditField` wrapper from the three affected nodes and wire `onChange` directly.
3. Delete `InlineEditField` component and test files.
4. Remove `InlineEditField` from the shared index export.
5. Run existing tests; update integration tests in `expression-input.integration.test.tsx` to cover blur-commit behaviour.

No data migration or deployment steps needed — this is a pure UI behaviour change.

## Open Questions

_(none)_
