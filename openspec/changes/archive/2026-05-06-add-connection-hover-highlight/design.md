## Context

`WorkflowEdgeComponent` already tracks `isHovered` and `isToolbarHovered` to show the edge action toolbar. The visible edge stroke is currently derived from `selected` and `isInsertPending`; hover only affects toolbar visibility. The transparent interaction path sits in the same SVG group as the visible edge, so the existing hover state can be reused for stroke highlighting.

The workflow canvas already uses `var(--primary)` for related active visuals such as selection and mini-map viewport indication, making it the natural token for an active connection hover state.

## Goals / Non-Goals

**Goals:**

- Make hovered workflow connections visually obvious by changing the visible stroke color to `var(--primary)`.
- Preserve the existing neutral default stroke for non-hovered, non-active connections.
- Preserve selected and insert-pending edge emphasis.
- Keep toolbar hover from causing flicker or dropping the active edge visual while the pointer moves between the edge and toolbar.
- Keep the implementation local to edge rendering.

**Non-Goals:**

- Add new graph state for hovered edges.
- Change connection validation or edge creation behavior.
- Change the edge toolbar layout or available actions.
- Introduce a new design token.
- Rework routed edge geometry or ELK layout behavior.

## Decisions

### Decision: Use local edge hover state for stroke styling

The renderer will use the existing `isHovered` state, combined with `isToolbarHovered`, `selected`, and `isInsertPending`, to decide the edge stroke. This keeps hover purely presentational and avoids store churn while the pointer moves across many edges.

Alternative considered: track hovered edge id in the workflow store. That would make a transient visual affordance part of shared editor state and create unnecessary updates.

### Decision: Use `var(--primary)` for hovered, selected, and insert-pending active color

Hover should switch the visible stroke color to `var(--primary)`. Selected and insert-pending states should continue to be visually emphasized; using the same active color keeps connection affordances consistent with the canvas selection palette.

Alternative considered: use `color-mix` or a dedicated edge-hover variable. The requested behavior can be satisfied with the existing primary token, and adding a token would be premature for one edge state.

### Decision: Keep edge path geometry unchanged

Only stroke styling changes on hover. The SVG path, transparent hit area, label coordinates, marker behavior, and toolbar placement remain unchanged for both Bezier and routed connections.

Alternative considered: increase stroke width only. Width-only feedback is less visible on dense canvases and does not satisfy the requested recolor behavior.

## Risks / Trade-offs

- Primary-colored hover and selected states may look similar -> This is acceptable because both communicate active edge focus, while toolbar visibility still distinguishes hover affordance.
- Inline style merge order can accidentally override the hover stroke -> Ensure the active stroke style is applied after incoming `style` props so the hover color wins.
- Tests may mock `BaseEdge`, so assertions should inspect the rendered path style rather than implementation details.

## Migration Plan

1. Update edge stroke style calculation to include hover and toolbar-hover active states.
2. Use `var(--primary)` for active edge stroke while preserving current stroke width behavior.
3. Add component tests that fire pointer/mouse hover events and assert primary stroke on the visible edge.
4. Run the flow package tests and typecheck for the affected component.

## Open Questions

- Should selected edges also switch to `var(--primary)` if they currently only grow slightly with `var(--border)`? The implementation should prefer a consistent active color unless visual review shows selected state needs a separate treatment.
