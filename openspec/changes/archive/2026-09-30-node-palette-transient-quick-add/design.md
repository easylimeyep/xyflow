# Design

## Context

`WorkflowEditorLayoutProvider` holds `isPaletteOpen` in `useState(true)` and an effect writes `setIsPaletteOpen(true)` whenever `quickAddActive` (quick-add or edge-insert pending) turns on. That write is what erases the user's choice (see proposal.md - Why).

Consumers of the open flag today:
- `WorkflowEditorPalette` → `NodePalette isOpen` (falls back to the `open` prop first).
- The built-in toggle in the toolbar (label + `setIsPaletteOpen(!isPaletteOpen)`).
- `WorkflowEditorSearch` → `besidePalette`, which shifts right-side and centred floating search bars clear of the floating palette.
- Hosts via `useWorkflowLayout()` (storybook `provider-layout-example.tsx`, ADR 0008).

Stacking: floating search is `z-30`, floating palette is `z-10`.

Pending insertions already clear themselves: `confirmQuickAddNode` / `confirmEdgeInsertNode` null the pending state, and Esc / canvas click call `cancelQuickAdd` / `cancelEdgeInsert`. Plain `addNode` / `addNodeAt` (palette drag-drop) do not.

## Goals / Non-Goals

**Goals:**
- Visibility is derived, not written: no effect syncs `quickAddActive` into the open flag.
- One definition of "visible" shared by the palette, and exposed to hosts.

**Non-Goals:**
- A separate quick-add popover/command menu at the "+" handle.
- Drop-to-connect (dragging a card during quick-add to place and wire it).
- Persisting the open flag across reloads.

## Decisions

### Derive visibility instead of syncing it
`isPaletteVisible = isPaletteOpen || quickAddActive`, computed in the layout provider and put on the context. The `useEffect` that forced `setIsPaletteOpen(true)` is deleted. Cancellation needs no extra code: when the pending state clears, visibility follows.

*Alternative:* remember "was closed before quick-add" in a ref and restore it afterwards. Rejected — two writers to one flag, and every exit path (confirm, Esc, canvas click, mode switch) must remember to restore.

### Host `open` prop is intent too
`WorkflowEditorPalette` computes `isOpen = (open ?? layout.isPaletteOpen ?? true) || quickAddActive`. A host that controls the palette with `open` gets the same transient behavior as the built-in state, so quick-add never waits on an invisible picker.

### Toggle reads intent and writes intent
The built-in toggle keeps `setIsPaletteOpen(!isPaletteOpen)`. During a transient show `isPaletteOpen` is `false`, so a click sets it to `true` — this *is* the "pin" behavior with no special case. The `aria-label` and the rotated-plus icon read `isPaletteOpen`, so the button still offers "Show node palette" while the palette is only borrowed. Host toggles built on `useWorkflowLayout()` behave identically for free.

*Alternative:* toggle reads visibility (click would hide + cancel). Rejected by the user in exploration — it silently discards the pending insertion.

### Search clearance on intent, palette raised while borrowed
`besidePalette` keeps reading `isPaletteOpen` (intent), so the search does not jump on each quick-add. To let the borrowed palette cover the search, the palette style gains a stacking rule under `quickAddActive` for `placement: "floating"` that lifts it above the search's `z-30` (e.g. `z-40` via a compound variant). Inline placement is host-laid-out and untouched.

### Click-only during insertion
`NodePalette` sets `draggable={!quickAddActive}` on cards and skips `onDragStart` work when inactive. This also closes the gap where a drop during quick-add adds an unconnected node while leaving the insertion pending (and, after this change, the transient palette stuck open). No store change needed.

### Hand focus back when the palette hides
`NodePalette` already focuses its container when a quick-add opens it. At that moment it records `document.activeElement` (the "+" button that started the insertion). On an open → closed transition, if `containerRef.current` contains `document.activeElement`, focus moves to the recorded element when it is still connected, otherwise to the closest `[data-workflow-editor-root]`. This is the same return-focus rule the floating search uses on close, so the editor behaves one way for both overlays. The check on "focus inside the palette" is what leaves a toggle-driven close alone.

*Alternative:* always focus the palette toggle. Rejected: the toggle may be host-owned and outside the package's reach, and the "+" button is where the user's attention already was.

### Public API shape
`WorkflowLayout` gains `isPaletteVisible: boolean`; existing fields keep their names. `isPaletteOpen`'s doc comment changes from "currently open" to "the user's open choice; see `isPaletteVisible` for what is on screen". Additive, non-breaking.

## Risks / Trade-offs

- [Host code that read `isPaletteOpen` as "on screen" now sees `false` during a transient show] → Documented in the type comment and ADR 0008 note; the only known consumer (storybook toggle) wants intent anyway.
- [Raised palette covers the search bar during quick-add on narrow and wide canvases] → Accepted by the user; the overlap lasts only while picking a kind, and narrow canvases already overlap today.
- [The "+" button is often gone after a quick-add completes (the output becomes saturated)] → Falls back to the editor root, which keeps Mod+F and editor hotkeys reachable.
- [Palette open/close transition plays on each quick-add when the palette was closed] → Existing 200ms translate/opacity transition; acceptable and signals the temporary state.
