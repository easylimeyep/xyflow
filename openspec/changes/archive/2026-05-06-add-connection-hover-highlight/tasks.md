## 1. Edge Hover Styling

- [x] 1.1 Update `WorkflowEdgeComponent` stroke style calculation so hovered workflow connections use `var(--primary)`.
- [x] 1.2 Ensure toolbar hover keeps the connection highlighted while the toolbar is visible.
- [x] 1.3 Preserve selected and insert-pending emphasis without changing edge geometry or toolbar behavior.

## 2. Tests

- [x] 2.1 Add or update workflow edge component tests for hover primary stroke.
- [x] 2.2 Add or update tests proving non-hovered edges keep the neutral stroke.
- [x] 2.3 Verify selected and insert-pending edges still render with active emphasis.

## 3. Verification

- [ ] 3.1 Run the affected flow package test suite.
- [x] 3.2 Run typecheck for affected packages.
- [x] 3.3 Visually verify in the workflow canvas that hovering a connection recolors it and the toolbar remains usable.
