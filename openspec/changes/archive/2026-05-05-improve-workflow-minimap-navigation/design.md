## Context

The workflow canvas renders `@xyflow/react`'s `ReactFlow` with `MiniMap`, `Controls`, and `Background`. The current mini map is rendered with default props, while global flow styles position it above the bottom-left controls. The workflow canvas already owns the React Flow instance through `useReactFlow`, and the existing zoom contract defines bounded canvas zoom from `0.1` to `4`.

This change keeps the existing viewport zoom bounds and mini map position, but turns the mini map into an intentional navigation surface. Users should be able to click or drag in the mini map to move around large workflows while still keeping enough visual contrast to understand the currently visible area.

## Goals / Non-Goals

**Goals:**
- Center the main canvas on the mini map point a user clicks.
- Preserve the current zoom level during click-based mini map navigation.
- Animate click navigation with a short 150-250ms transition.
- Enable mini map drag panning.
- Keep wheel zoom disabled inside the mini map.
- Make the viewport bounds visible at low zoom by using a primary-colored, thicker mini map mask stroke.
- Apply `radius-md` and clipping to the mini map's outer container.
- Add regression coverage for the mini map behavior and visual props.

**Non-Goals:**
- Do not change the workflow canvas minimum or maximum zoom.
- Do not move or resize the mini map.
- Do not select workflow nodes from the mini map.
- Do not add cursor-specific affordance styles.
- Do not replace React Flow's built-in mini map implementation.

## Decisions

### Decision: Use React Flow MiniMap and viewport APIs

Configure the existing `MiniMap` with `onClick`, `pannable`, `zoomable={false}`, `maskStrokeColor`, and `maskStrokeWidth`. For click navigation, use the React Flow instance to set the viewport so the clicked flow position becomes the canvas center while preserving `reactFlow.getViewport().zoom`.

Alternative considered: implement a custom mini map overlay and pointer math. This was rejected because React Flow already exposes mini map pointer coordinates and viewport mutation APIs, and the current canvas is already built around React Flow.

### Decision: Preserve zoom on click navigation

Clicking the mini map should update only viewport position, not scale. The user may already be inspecting the graph at a chosen zoom, so mini map navigation should move the camera without changing detail level.

Alternative considered: refit or zoom to the clicked area. This was rejected because it makes a navigation click unexpectedly destructive to the user's current zoom context.

### Decision: Let built-in mini map panning handle drag

Enable `pannable` for drag panning and keep `zoomable` disabled. This gives users a familiar map-drag interaction without introducing a second wheel-zoom surface inside the canvas.

Alternative considered: custom drag handling through `onClick` and pointer events. This was rejected because built-in panning is simpler and should stay aligned with React Flow behavior.

### Decision: Strengthen the viewport stroke with primary color

Use `var(--primary)` for the mini map viewport mask stroke and increase `maskStrokeWidth` above the default so the active viewport remains visible when the mini map is highly compressed.

Alternative considered: darkening the mask only. This was rejected because the reported problem is the viewport boundary disappearing; a stronger stroke addresses the boundary directly.

### Decision: Round and clip only the outer container

Apply `border-radius: var(--radius-md)` and `overflow: hidden` to `.react-flow__minimap`. Keep mini map node shapes unchanged so the map remains a faithful schematic overview.

Alternative considered: also rounding mini map nodes. This was rejected because the user specifically scoped rounding to the outer container.

## Risks / Trade-offs

- [Risk] Click navigation math could be off if the canvas dimensions are unavailable in tests or during early mount. -> Mitigation: use React Flow's instance APIs and guard against missing viewport/container data if needed.
- [Risk] Built-in mini map drag may update the viewport differently than click centering. -> Mitigation: rely on React Flow's `pannable` behavior for drag and cover the prop configuration in tests.
- [Risk] A thicker primary viewport stroke could be too visually loud in some themes. -> Mitigation: keep the change scoped to the mini map mask stroke and use the existing `--primary` token.
- [Risk] CSS clipping might hide default box-shadow or internal SVG edges. -> Mitigation: preserve the existing border and position while clipping only overflow.
