## Why

Consumers can pass a custom `initialGraph` into `WorkflowEditor`, but today they have to hand-author node widths, positions, and edge metadata even for simple starter flows. That makes examples noisy, duplicates registry defaults, and makes it harder to create reusable presets that stay aligned with the editor's ELK-based layout behavior.

## What Changes

- Add a new public initial-graph builder capability for `@workspace/flow` that accepts a compact node/edge description and returns a valid `WorkflowGraphState`.
- Support a synchronous `linear` builder path for deterministic default positioning without requiring consumers to provide node sizes or coordinates.
- Support an asynchronous `elk` builder path that reuses the existing workflow ELK auto-layout pipeline to compute initial positions from the same graph description.
- Normalize node defaults, edge metadata, document defaults, and viewport defaults inside the builder so consumers only provide semantic workflow data.
- Update package exports and docs/example usage so the sample page can demonstrate builder-based `initialGraph` authoring instead of a fully manual graph object.

## Capabilities

### New Capabilities
- `workflow-initial-graph-builders`: Public utilities that transform a compact workflow description into a normalized `WorkflowGraphState` using either deterministic linear placement or ELK layout.

### Modified Capabilities
- `workflow-editor-compound-api`: The flow package root export surface changes to expose the new initial-graph builder utilities alongside `WorkflowEditor`.

## Impact

- Affected code in `packages/flow/src/workflow/` for builder normalization, layout orchestration, and package exports.
- Example usage in `apps/web/app/page.tsx` becomes builder-driven instead of manually authored coordinates and widths.
- No breaking change to `WorkflowEditor` props; `initialGraph` remains a `WorkflowGraphState`.
- Reuses the existing `elkjs` dependency and current workflow layout helpers rather than introducing a second layout engine.
