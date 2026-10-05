# Proposal

## Why

Dragging a node kind from the palette shows a stray stripe along the right edge of the drag ghost. The palette never sets a drag image, so Chrome snapshots the card by painting its enclosing layer — the scrolling card list — clipped to the card's box, and the list's macOS overlay scrollbar lands in the snapshot. Confirmed by hand: with the list's `overflow` set to `visible` the stripe disappears, at every page zoom.

## What Changes

- Palette entries set their own drag image on `dragstart` with `event.dataTransfer.setDragImage`, instead of letting the browser photograph the card inside the scroll container.
- The image is a dedicated preview element rendered outside the palette's scroll container: an opaque, bordered chip with the node kind's icon and title, so it reads as "a node being carried" rather than a palette card.
- The preview is anchored so the cursor sits at its top-left corner, which is where the canvas drop handler places the new node.
- No change to what a drop does, to the click-to-add path, or to the rule that entries are not draggable while a quick-add or edge-insert is pending.

Rejected alternatives, recorded so they are not re-proposed: padding the list (`pr-2`) or `scrollbar-gutter: stable` only moves the cards out of the scrollbar's way and narrows them; removing the list's scroll breaks long registries.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `workflow-node-palette`: adds a requirement that dragging an entry shows a dedicated preview of the node kind rather than a snapshot of the palette card.

## Impact

- `packages/flow/src/workflow/components/node-palette/node-palette.tsx` — `onDragStart` sets the drag image; renders the preview element.
- `packages/flow/src/styles/components/panels/node-palette.styles.ts` — `tv` slots for the preview.
- `packages/flow/src/workflow/components/node-palette/node-palette.test.tsx` — drag-start coverage.
- No public API, store, or dependency changes. The canvas drop handler (`workflow-canvas.tsx`) is untouched.
