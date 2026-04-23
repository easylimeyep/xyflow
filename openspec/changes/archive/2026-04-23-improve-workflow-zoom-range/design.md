## Context

The workflow editor renders its graph through `WorkflowCanvas`, which wraps `@xyflow/react`'s `<ReactFlow />` component. The canvas currently passes `defaultViewport`, pan/zoom interaction flags, and built-in `<Controls />`, but it does not pass `minZoom` or `maxZoom`.

React Flow's documented defaults are `minZoom=0.5` and `maxZoom=2`. That implicit range is narrow for a workflow editor because users need both a broad overview of larger graphs and a close inspection mode for dense node content.

## Goals / Non-Goals

**Goals:**
- Make workflow zoom bounds explicit in the codebase.
- Expand zoom-out enough for large graph overview.
- Expand zoom-in enough for detailed node inspection.
- Keep built-in controls, pinch zoom, fit view, persisted viewport updates, and auto-layout refit aligned to the same bounds.
- Preserve current viewport persistence and history semantics.

**Non-Goals:**
- Introduce custom zoom controls or replace React Flow's built-in controls.
- Make zoom unbounded.
- Change pan behavior, minimap behavior, node sizing, or graph layout algorithms.
- Add a user preference for custom zoom limits in this change.

## Decisions

1. Define workflow-specific zoom constants near `WorkflowCanvas`.

   Use `WORKFLOW_MIN_ZOOM = 0.1` and `WORKFLOW_MAX_ZOOM = 4`. This makes the product choice visible, testable, and independent from upstream React Flow defaults.

   Alternative considered: use React Flow defaults. Rejected because the current behavior is the problem and remains easy to regress when defaults are implicit.

   Alternative considered: remove limits entirely. Rejected because extreme transforms can make the editor unusable, reduce pointer precision, and increase the chance of hard-to-debug viewport states.

2. Pass the constants to `<ReactFlow minZoom maxZoom>`.

   React Flow already applies these bounds consistently to wheel/pinch/programmatic zoom operations and controls. Staying inside that API avoids duplicating viewport math in the app.

   Alternative considered: intercept `<Controls />` zoom handlers and implement custom steps. Rejected because the complaint is about allowed range, not step behavior, and custom handlers would add maintenance surface.

3. Pass matching bounds to fit-view calls owned by the workflow canvas.

   Auto-layout calls `reactFlow.fitView({ padding: WORKFLOW_ELK_PADDING })` after successful layout. The refit should pass the same min/max bounds so a successful auto-layout cannot land outside the product-defined range or become dependent on library defaults.

   Alternative considered: only set bounds on `<ReactFlow />`. This likely bounds interaction, but explicitly bounding fit-view documents the intended behavior at the call site.

4. Keep persisted viewport validation as positive-number validation.

   Existing mappers accept any positive zoom from stored data. This change does not need a migration. Runtime interaction will move users back into the configured range; historical data should not be rejected solely because it was created before the new contract.

## Risks / Trade-offs

- Wider zoom-out can make labels unreadable at the lowest scale -> Keep a finite minimum and rely on minimap/pan for navigation when details are too small.
- Wider zoom-in can expose visual imperfections in node internals -> Keep a finite maximum and verify core canvas tests rather than treating this as a node redesign.
- Existing saved graphs may contain viewport zooms outside the new bounds -> Do not reject persisted data; React Flow interaction and future viewport changes will normalize practical use.
- Upstream React Flow behavior may change -> Explicit constants and tests protect the workflow canvas contract.
