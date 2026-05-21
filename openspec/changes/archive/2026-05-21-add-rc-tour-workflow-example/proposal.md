## Why

`apps/web` already includes `@rc-component/tour` and the flow package already exposes renderer-agnostic workflow tour metadata, but the examples page only demonstrates the anchor registry in code. A live rc-tour example will prove the helper contract in a real consumer and make the intended integration path easier to copy.

## What Changes

- Update the existing tour anchors example in `apps/web` so it renders an interactive `@rc-component/tour` walkthrough.
- Adapt `WORKFLOW_EDITOR_TOUR` through the app-side tour helper by lazily resolving each step against `WorkflowEditor` `anchorRefs`.
- Add example UI controls to start and stop the tour without changing the flow package's renderer-agnostic tour metadata.
- Include rc-tour styles and keep the example resilient when an anchor is temporarily unavailable.

## Capabilities

### New Capabilities

### Modified Capabilities
- `workflow-editor-tour-anchors`: Consuming apps must be able to present the default workflow tour metadata through an rc-tour renderer using lazy anchor targets.

## Impact

- `apps/web/app/components/workflow-examples/tour-anchors-example.tsx`
- Potentially `apps/web/app/page.tsx` or `apps/web/app/layout.tsx` if the example label or rc-tour CSS import needs adjustment
- No breaking changes to `@workspace/flow`; `WORKFLOW_EDITOR_TOUR` remains renderer agnostic
- Uses the existing `@rc-component/tour` dependency already declared in `apps/web`
