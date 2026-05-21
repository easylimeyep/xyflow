## 1. rc-tour Example Integration

- [x] 1.1 Import `@rc-component/tour` in `apps/web/app/components/workflow-examples/tour-anchors-example.tsx` and map `WORKFLOW_EDITOR_TOUR` to rc-tour step props.
- [x] 1.2 Preserve the existing workflow tour anchor resolver and use lazy `target` callbacks against `anchorRefs.current`.
- [x] 1.3 Add local `open` and `current` state plus start, close, finish, and change handlers for the example tour.
- [x] 1.4 Render the tour together with `WorkflowEditor` and keep `@workspace/flow` free of rc-tour imports.

## 2. Example Presentation

- [x] 2.1 Add a compact example control for starting the tour.
- [x] 2.2 Update the example title, description, and code preview so the rc-tour integration is copyable.
- [x] 2.3 Add minimal styling or scoped classes needed for rc-tour popover readability and z-index behavior.

## 3. Verification

- [x] 3.1 Run the relevant `apps/web` typecheck or lint command.
- [x] 3.2 Start the local web app and verify the tour example opens an rc-tour walkthrough in the browser.
- [x] 3.3 Confirm missing or unmounted anchors resolve to `null` without runtime errors.
