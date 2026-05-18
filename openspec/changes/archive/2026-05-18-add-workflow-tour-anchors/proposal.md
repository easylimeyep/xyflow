## Why

Applications embedding `WorkflowEditor` need a stable way to attach custom product tours to editor controls, palette items, and panels without depending on internal DOM structure or `@xyflow/react` implementation details.

## What Changes

- Add a public workflow editor anchor registry API, exposed through an `anchorRefs` prop, that records mounted DOM elements for tour targets.
- Include editor-level anchors for key surfaces such as root, toolbar, palette, palette toggle, canvas, controls, zoom buttons, fit view, auto layout, and config panel.
- Include palette item anchors keyed by `NodeKind` so new node kinds can participate without expanding the top-level anchor contract.
- Export default tour metadata as `WORKFLOW_EDITOR_TOUR` from `@workspace/flow`.
- Keep tour rendering library-agnostic: consuming apps resolve tour metadata anchors to DOM targets and adapt them to their custom tour component.

## Capabilities

### New Capabilities
- `workflow-editor-tour-anchors`: Public workflow editor tour anchors and default tour metadata for app-level onboarding integrations.

### Modified Capabilities

## Impact

- Affects `packages/flow` public exports and `WorkflowEditor` props.
- Adds typed metadata and resolver-friendly anchor identifiers for external tour components.
- Requires targeted unit coverage for anchor registration, palette item anchors, and exported tour metadata.
- No new runtime dependency on a tour library.
