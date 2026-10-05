# Design

## Context

See proposal.md — Why. Relevant current state:

- `NodePalette` cards are native HTML5 drag sources (`draggable` + `onDragStart`), with no `setDragImage`. The card is a plain `div` without its own paint layer, so Chrome rasterizes the drag image from the enclosing layer — the `overflow-y-auto` list — and the overlay scrollbar comes along.
- The canvas drop handler (`workflow-canvas.tsx`) reads `WORKFLOW_NODE_KIND_MIME`, converts `clientX/Y` with `screenToFlowPosition`, and `addNode` uses that point as the node's top-left. Nothing on the drop side changes.
- `packages/flow` composes classes with `tv` slots (no `cn`).

## Goals / Non-Goals

**Goals:**
- A drag image the browser builds from an element we own, with an opaque background and its own paint layer.
- The cursor-to-preview offset matches where the node lands.

**Non-Goals:**
- Rendering the real canvas node component as the preview (it needs store/React Flow context and is far larger than a ghost should be).
- Switching the palette to dnd-kit or a custom pointer-driven drag overlay.
- Live preview content beyond icon + title (no ports, no fields).

## Decisions

**1. One preview element, rendered outside the scroll list, filled on `dragstart` with `flushSync`.**
`NodePalette` renders a single preview element as a sibling of the `aside` (inside its existing fragment), not inside the list. On `dragstart` the handler records the dragged kind in local state inside `flushSync`, so React commits the preview's icon and title before `setDragImage` is called in the same handler; the browser snapshots the element synchronously.
*Alternatives:* one hidden preview per entry — no `flushSync`, but doubles the palette's DOM for every registry kind, and the extensible registry can be long. Imperatively writing `textContent` — sidesteps React and cannot render the kind's icon component.

**2. Keep the preview rendered but off-screen, not `display: none`.**
Browsers only rasterize a rendered element. The preview is `position: fixed` (giving it its own paint layer, so nothing behind or around it is captured), parked off-screen with a negative `top`, `pointer-events-none`, and `aria-hidden`. Avoid `transform` for parking — it can shift where Chrome samples the element.
*Alternative:* mount the preview only during the drag — it would have to mount, commit, and be snapshotted inside one handler anyway, which is what `flushSync` already does; keeping it mounted is simpler.

**3. Offset `(0, 0)`.**
`setDragImage(preview, 0, 0)` puts the pointer at the preview's top-left, which is exactly the point `addNode` uses for the new node, so the ghost previews the drop placement.
*Alternative:* preserving the grab offset inside the card — matches the card, but the node would then land offset from where its ghost appeared.

**4. Look: an opaque node "chip".**
`bg-card`/`bg-background`, `border`, `rounded-md`, a small shadow, icon + title in one row, fixed width (about `w-48`). Defined as new slots (`preview`, `previewIcon`, `previewTitle`) on `nodePaletteStyles`.

**5. Clear the dragged kind on `dragend`.**
Resets the preview to empty so a stale kind never lingers; harmless if skipped, but keeps state honest.

## Risks / Trade-offs

- [`setDragImage` missing on the event's `dataTransfer` (old engines, test environments)] → guard with optional chaining; the browser falls back to its default ghost, which is today's behaviour.
- [Firefox/Safari rasterize off-screen elements differently] → manual check in both during apply. Park with `top: -1000px; left: 0`, the widely used placement; do not hide with `opacity-0` or `visibility: hidden`, because the browser captures those too and the ghost comes out blank.
- [`flushSync` warning if called during render] → it is only called from the `dragstart` event handler, where it is allowed.
- [jsdom has no real `DataTransfer`] → tests pass a stub `dataTransfer` to `fireEvent.dragStart` and assert on `setDragImage` and `setData`; the visual result is verified by hand in Chrome with a scrollable palette.
