## Why

Workflow connections currently reveal their insert/delete toolbar on hover, but the connection stroke itself stays visually neutral. In dense canvases this makes it harder to confirm which connection is active before using edge actions.

## What Changes

- Highlight a workflow connection when the pointer hovers over its interactive edge area.
- Use the existing primary color token for the hover stroke so the affordance matches other workflow canvas highlights.
- Preserve existing selected and edge-insert-pending emphasis.
- Keep the behavior consistent for both standard Bezier connections and routed connections when routed path data is present.
- Add focused tests for hover styling and existing selected/pending behavior.

## Capabilities

### Modified Capabilities

- `workflow-elk-edge-routing`: The workflow edge renderer should include a primary-colored hover state while preserving routed/fallback rendering and edge actions.

## Impact

- Affects `packages/flow/src/workflow/components/workflow-edge/workflow-edge.tsx`.
- May affect workflow edge component tests in `packages/flow/src/workflow/components/workflow-edge/workflow-edge.test.tsx`.
- Does not change graph state, connection validation, auto-layout, edge routing data, or import/export DTO behavior.
