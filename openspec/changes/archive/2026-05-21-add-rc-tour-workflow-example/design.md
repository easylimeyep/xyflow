## Context

The flow package exposes `WORKFLOW_EDITOR_TOUR` and `WorkflowEditor` `anchorRefs` so consumers can build onboarding tours without depending on internal DOM selectors. `apps/web` currently has a `TourAnchorsExample`, but it only shows the registry and lazy target mapping in the code preview while rendering a plain editor.

`apps/web` already depends on `@rc-component/tour`. Its `TourStepInfo.target` type accepts either an `HTMLElement`, `null`, or a callback returning either value, which matches the existing workflow tour helper pattern.

## Goals / Non-Goals

**Goals:**
- Turn the existing tour anchors example into a working rc-tour integration.
- Keep tour target resolution lazy through `anchorRefs.current`.
- Make the example copyable for consumers that want to adapt `WORKFLOW_EDITOR_TOUR`.
- Keep the flow package renderer agnostic.

**Non-Goals:**
- Add `@rc-component/tour` to `@workspace/flow`.
- Change the public shape of `WORKFLOW_EDITOR_TOUR`.
- Build a reusable production tour service or persistence layer.
- Add analytics, first-run storage, or user preference management.

## Decisions

1. **Render rc-tour in the app example**

   Use `@rc-component/tour` directly inside `apps/web/app/components/workflow-examples/tour-anchors-example.tsx`. This keeps the dependency at the consumer layer and demonstrates the real integration point. The alternative, wrapping rc-tour in `@workspace/flow`, would make the flow package renderer-specific and conflict with the existing tour metadata contract.

2. **Adapt workflow tour metadata at render time**

   Map each `WORKFLOW_EDITOR_TOUR` step to rc-tour step props with `title`, `description`, `placement`, and `target: () => resolveWorkflowTourAnchor(step.anchor, anchorRefs.current)`. This preserves lazy lookup so targets are resolved after the editor has mounted and can safely return `null` when a surface is unavailable.

3. **Control the example locally**

   Store `open` and `current` state in the example component. Provide a compact "Start tour" control and close/finish handlers that reset the example state. This keeps the example deterministic for docs and Playwright verification without adding global state.

4. **Style only what rc-tour does not provide**

   If the package does not ship a CSS entrypoint, style the rendered tour through `className`, `rootClassName`, `classNames`, or local/global app CSS as needed. The implementation should avoid broad global selectors where a scoped class is sufficient.

## Risks / Trade-offs

- **Anchor is unavailable when a step opens** -> The lazy resolver returns `null`; the example should not throw and should let rc-tour render safely or move to the next available step through normal controls.
- **Tour overlay can sit behind editor UI** -> Set an explicit `zIndex` high enough for the examples page.
- **Example becomes too app-specific** -> Keep code preview focused on `WORKFLOW_EDITOR_TOUR`, `anchorRefs`, `resolveWorkflowTourAnchor`, and rc-tour props rather than unrelated presentation details.
- **rc-tour styling is sparse by default** -> Add minimal app-side styling only for the example surface and popover readability.
