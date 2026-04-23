## Why

Workflow zoom currently feels too constrained because `WorkflowCanvas` does not set explicit zoom bounds and therefore inherits React Flow's default `minZoom=0.5` and `maxZoom=2`. Those defaults are reasonable for simple demos, but they make large workflows hard to inspect from a distance and detailed node editing feel cramped.

## What Changes

- Add explicit workflow viewport zoom bounds instead of relying on React Flow defaults.
- Increase the usable zoom-out range enough to review larger graphs and the usable zoom-in range enough to inspect dense node content.
- Keep zoom bounded to avoid unreadable UI, accidental extreme transforms, and performance/pathological interaction issues.
- Ensure built-in controls, pinch zoom, fit view, persisted viewport changes, and auto-layout refit respect the same workflow-specific bounds.
- Add focused tests that lock the intended zoom limits into the canvas contract.

## Capabilities

### New Capabilities
- `workflow-viewport-zoom`: Defines expected zoom range behavior for the workflow editor viewport.

### Modified Capabilities

## Impact

- Affected code: `packages/flow/src/workflow/components/workflow-canvas/workflow-canvas.tsx`
- Affected tests: `packages/flow/src/workflow/components/workflow-canvas/workflow-canvas.test.tsx`
- External dependency behavior: `@xyflow/react` remains the viewport engine, but the app stops depending on its implicit zoom defaults.
- No breaking API changes are expected for consumers of `WorkflowEditor` or `WorkflowCanvas`.
