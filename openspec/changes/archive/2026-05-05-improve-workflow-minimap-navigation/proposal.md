## Why

The workflow mini map should remain useful as the canvas grows and users zoom far out. Today the visible viewport bounds can become hard to see, and the mini map does not provide direct navigation to the area a user clicks.

## What Changes

- Make the workflow mini map clickable so clicking a point centers the main canvas on that flow position.
- Preserve the current canvas zoom when navigating through the mini map.
- Animate click-based mini map navigation with a short 150-250ms transition.
- Enable drag panning inside the mini map.
- Keep wheel zoom disabled inside the mini map.
- Treat clicks on mini map nodes the same as ordinary mini map point clicks, without selecting nodes.
- Improve mini map viewport visibility by using a primary-colored, thicker viewport stroke.
- Round and clip the mini map container with the design system `radius-md` token while keeping its current position.

## Capabilities

### New Capabilities
- `workflow-minimap-navigation`: Defines workflow mini map navigation, viewport visibility, and container styling behavior.

### Modified Capabilities

## Impact

- `packages/flow/src/workflow/components/workflow-canvas/workflow-canvas.tsx`: Configure mini map navigation and visual props.
- `packages/flow/src/workflow/components/workflow-canvas/workflow-canvas.test.tsx`: Add regression coverage for mini map props and click navigation behavior.
- `packages/flow/src/style.css`: Update mini map container radius, clipping, and related visual styling.
- No new runtime dependencies are expected; this should use existing `@xyflow/react` MiniMap and React Flow instance APIs.
