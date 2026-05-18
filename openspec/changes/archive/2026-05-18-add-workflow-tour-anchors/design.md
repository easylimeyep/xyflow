## Context

`WorkflowEditor` is consumed as an embeddable editor, including through its default composition and compound components. External products need to run custom guided tours that target editor surfaces such as the palette, canvas controls, config panel, and individual palette node cards.

The current DOM structure is not a stable integration contract. Some controls are rendered by `@xyflow/react` `Controls`, whose built-in zoom and fit-view buttons do not expose refs for external tour targeting. The workflow node palette is registry-driven, so per-node tour anchors need to follow `NodeKind` instead of a hand-maintained list of top-level props.

## Goals / Non-Goals

**Goals:**
- Provide a typed `anchorRefs` prop for `WorkflowEditor` that lets an app pass a single mutable registry ref.
- Register editor anchor elements into `anchorRefs.current` as components mount and remove them as components unmount.
- Support palette item anchors as `paletteItems[kind]`, keyed by the existing `NodeKind` union.
- Export default library-agnostic tour metadata as `WORKFLOW_EDITOR_TOUR`.
- Keep consuming apps responsible for resolving anchors to their custom tour component's `target: () => HTMLElement | null` format.

**Non-Goals:**
- Do not add a tour rendering library or UI overlay to `packages/flow`.
- Do not make `WorkflowEditor` manage tour state, step progression, spotlight behavior, or persistence.
- Do not expose unstable internal DOM selectors as the tour API.
- Do not require apps to create one `useRef` per anchor.

## Decisions

### Use one mutable anchor registry ref

`WorkflowEditor` will accept an `anchorRefs` prop shaped as a mutable ref object:

```ts
type WorkflowEditorAnchorElements = Partial<{
  root: HTMLDivElement
  toolbar: HTMLDivElement
  palette: HTMLElement
  paletteToggle: HTMLButtonElement
  canvas: HTMLDivElement
  controls: HTMLDivElement
  zoomIn: HTMLButtonElement
  zoomOut: HTMLButtonElement
  fitView: HTMLButtonElement
  autoLayout: HTMLButtonElement
  configPanel: HTMLElement
  paletteItems: Partial<Record<NodeKind, HTMLElement>>
}>
```

The app usage stays compact:

```tsx
const anchorRefs = useRef<WorkflowEditorAnchorElements>({})

<WorkflowEditor anchorRefs={anchorRefs} />
```

Because the tour uses lazy callbacks such as `target: () => ...`, registry updates do not need to trigger React renders.

Alternative considered: `Partial<Record<Anchor, React.RefObject<Element>>>`. This is type-safe but forces apps to allocate many refs and makes palette items more verbose.

### Keep tour metadata separate from DOM refs

`WORKFLOW_EDITOR_TOUR` will be exported as static metadata. A tour step references a stable anchor descriptor rather than a DOM element:

```ts
type WorkflowTourAnchor =
  | { type: "editor"; id: WorkflowEditorAnchor }
  | { type: "paletteItem"; kind: NodeKind }
```

Consuming apps resolve the descriptor against `anchorRefs.current` and adapt the result to their tour component:

```ts
target: () => resolveWorkflowTourAnchor(step.anchor, anchorRefs.current)
```

This keeps `packages/flow` independent from the tour implementation while still providing default content.

### Replace built-in React Flow controls where refs are required

`@xyflow/react` `Controls` does not forward refs to its internal zoom and fit-view buttons. To expose `zoomIn`, `zoomOut`, `fitView`, and `autoLayout` anchors, workflow canvas controls should be rendered explicitly with buttons wired to `useReactFlow()`.

Alternative considered: query internal `.react-flow__controls-zoomin` selectors. This would couple the public tour API to third-party DOM internals and can break across upgrades.

### Use `NodeKind` for palette item anchors

Palette card anchors will be stored under `anchorRefs.current.paletteItems[kind]`. This follows the registry-driven node model: adding a new node kind expands the `NodeKind` union and makes the anchor available without adding a new top-level anchor key.

## Risks / Trade-offs

- Registry refs are mutable and do not cause re-renders → tour adapters must resolve targets lazily with `target: () => ...`.
- Palette items can be unavailable when the palette is closed or unmounted → unregister anchors on unmount and let the tour adapter skip, wait, or open the palette before showing dependent steps.
- Replacing built-in controls may require matching existing React Flow control styling and accessibility labels → preserve current labels and visual affordances in tests.
- Static tour copy can become stale as UI evolves → keep `WORKFLOW_EDITOR_TOUR` colocated with workflow editor exports and cover anchor ids in tests.
