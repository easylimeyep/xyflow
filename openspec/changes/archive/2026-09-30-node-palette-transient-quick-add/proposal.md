# Proposal

## Why

Quick-add (the "+" on a node output or on an edge) forces the node palette open by writing `true` into the same state the palette toggle owns. A user who closed the palette finds it open for good after a single quick-add, so the toggle stops meaning anything. Quick-add only needs the palette as a momentary picker; it should borrow the palette, not take it over.

## What Changes

- Split palette state into the user's intent (`isPaletteOpen`, owned by the toggle) and the effective visibility (`isPaletteVisible` = intent OR a pending quick-add / edge-insert). A palette the user closed opens for the duration of a quick-add and closes again once a kind is picked or the insertion is cancelled (Esc, canvas click).
- Clicking the palette toggle while the palette is shown only for a quick-add pins it open (intent becomes open); the quick-add stays pending.
- The search bar's "beside palette" clearance follows the user's intent, not the transient visibility, so it does not jump on every quick-add. The transiently shown floating palette sits above the search bar instead.
- Palette cards are not draggable while a quick-add or edge-insert is pending; the palette acts as a click-only picker in that mode.
- `useWorkflowLayout()` gains `isPaletteVisible`; `isPaletteOpen` keeps its meaning as the user-owned open flag.
- A host-controlled `WorkflowEditor.Palette open` prop is treated as intent too: a pending quick-add still shows the palette over `open={false}`.

## Capabilities

### New Capabilities
- `workflow-node-palette`: node palette visibility — user-owned open state, transient display during quick-add / edge-insert, toggle behavior, drag availability, overlap with the floating search, and the layout hook facts hosts read.

### Modified Capabilities
<!-- None: existing specs do not state palette visibility behavior. -->

## Impact

- `packages/flow/src/workflow/components/workflow-editor/workflow-editor.tsx` — layout context, `useWorkflowLayout`, `WorkflowEditorPalette`, palette toggle, search `besidePalette`.
- `packages/flow/src/workflow/components/node-palette/node-palette.tsx` — `draggable` gated on quick-add.
- `packages/flow/src/styles/components/panels/node-palette.styles.ts` — stacking above search while quick-add is active.
- Public API: additive `isPaletteVisible` on `WorkflowLayout`; no breaking change. Storybook `provider-layout-example.tsx` and ADR 0008 reference the layout hook and need to reflect the new field.
