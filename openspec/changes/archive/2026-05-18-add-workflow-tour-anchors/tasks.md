## 1. Public Types and Helpers

- [x] 1.1 Add public workflow editor anchor types for editor anchors, palette item anchors, anchor registry elements, and tour step metadata.
- [x] 1.2 Add internal callback-ref helpers that register and unregister editor anchors in a single mutable `anchorRefs.current` object.
- [x] 1.3 Export the new anchor and tour metadata types from the flow package public entrypoint.

## 2. Workflow Editor Anchor Registration

- [x] 2.1 Add the optional `anchorRefs` prop to `WorkflowEditor` and expose it through workflow editor layout context for compound components.
- [x] 2.2 Register editor-level anchors for root, toolbar, palette, palette toggle, canvas, controls, auto layout, and config panel.
- [x] 2.3 Register node palette item anchors under `paletteItems[kind]` for each rendered node palette card.
- [x] 2.4 Ensure anchor registration works for default composition and explicit compound composition.

## 3. Canvas Controls

- [x] 3.1 Replace ref-inaccessible built-in React Flow zoom and fit-view controls with explicit workflow control buttons wired to `useReactFlow()`.
- [x] 3.2 Register `zoomIn`, `zoomOut`, `fitView`, and `autoLayout` anchors on the explicit control buttons.
- [x] 3.3 Preserve existing control behavior, disabled states, labels, and visual styling.

## 4. Default Tour Metadata

- [x] 4.1 Add `WORKFLOW_EDITOR_TOUR` with library-agnostic step content and anchor descriptors.
- [x] 4.2 Include default steps for core editor surfaces and representative palette items.
- [x] 4.3 Keep metadata anchors typed against public editor anchors and `NodeKind`.

## 5. Tests and Examples

- [x] 5.1 Add unit tests for editor-level anchor registration and cleanup.
- [x] 5.2 Add unit tests for palette item anchors keyed by `NodeKind`.
- [x] 5.3 Add tests or type assertions for `WORKFLOW_EDITOR_TOUR` anchor validity.
- [x] 5.4 Update a web example or documentation snippet to show one mutable `anchorRefs` registry and lazy `target: () => ...` tour resolution.
- [x] 5.5 Run package checks and relevant workflow editor tests.
