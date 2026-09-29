# Design

## Context

See proposal.md for the motivation and specs/workflow-canvas-search/spec.md for the requirements. These parts of the current code shape the approach:

- **Node data.** A node is `Node<{ kind, label, config }>`.
  - Variable definitions come from the kind's optional `variable()` reader in the node registry (`node-registry/define-node.ts`).
  - `collectWorkflowVariables` (`expression/variables/variables.ts`) already walks every node for its variable catalog.
- **Variable references.** They live in `{{…}}` segments of expression fields. `expression/refactor/refactor.ts` walks exactly this field set (expression-ui text/textarea fields, `renameConfigKey`, `extraExpressionConfigKeys`, structured values via `refactorConfigValue`) with `parseTemplateSegments`. Today that walk is fused with rewriting.
- **Viewport.** It is controlled inline in `components/workflow-canvas/workflow-canvas.tsx` through `useReactFlow`. The minimap already centers the canvas with `setCenter(x, y, { zoom, duration: 200 })`. Zoom bounds (0.1–4) are constants in the same file.
- **Selection.**
  - `setSelectedNode` in `store/slices/selection-slice.ts` projects `selected` onto `history.present.nodes`.
  - Selecting creates no undo entry, but it does produce a new nodes array and re-renders every node whose `selected` flag flips.
- **Hotkeys.**
  - Handlers in `components/hotkeys/hotkeys.ts` are attached to `window` in `workflow-editor.tsx` and gated to `mode === "edit"`.
  - The expression editor passes a `basicSetup` object to `@uiw/react-codemirror` without disabling `searchKeymap`. So `Mod+F` inside an expression field currently opens CodeMirror's own search panel.
- **Rendering.** All nodes are mounted (`onlyRenderVisibleElements` is off). `workflow-performance-budget-v2` requires that unchanged nodes do not re-render on non-graph updates.

## Goals / Non-Goals

**Goals:**
- One traversal of "where expressions live" that both rename and search consume. Adding a new expression field to a node kind should make it both renamable and searchable, with no second place to update.
- Match computation as a pure function of (graph, registry, query), testable without React.
- Search UI state that does not touch graph history or the nodes array.

**Non-Goals:**
- Highlighting matched text inside inputs or CodeMirror (phase 2). Phase 1 marks whole nodes.
- Searching edges, node kinds or titles, the node id, or runtime observation values.
- Fuzzy matching.

## Decisions

### 1. Extract a read-only expression-field traversal from the refactor module

Add a visitor, for example `forEachExpressionField(registry, node, visit)`. It yields `{ fieldPath, template }` for every expression-bearing string in a node, in a deterministic field order.

- Rename becomes "visit, rewrite, rebuild config".
- Search becomes "visit, parse segments, collect".

The existing rename tests guard the extraction.

*Alternative:* a separate search-specific walk. Rejected: the two walks would drift, and search would silently miss fields that rename handles.

### 2. A pure match index

`buildSearchMatches(nodes, registry, query) -> SearchMatch[]`:

```
SearchMatch = {
  key: string            // `${nodeId}|${source}|${fieldPath}|${occurrence}`
  nodeId: string
  source: "label" | "variable-definition" | "variable-reference"
  fieldPath?: string     // for references
  occurrence: number     // n-th hit within that field/source
  start: number; end: number   // offsets, reserved for phase-2 text highlight
}
```

- **Labels** match against `data.label`.
- **Definitions** match against the name from `definition.variable(config)`.
- **References:** substring matches run only inside expression segments. Offsets are computed against the raw template, so phase 2 can highlight without re-parsing.
- **Order:** sort by node `position.y`, then `position.x`, then source rank (label < definition < reference), then field order, then `start`.

The `key` gives a stable identity for "keep current match across edits".

The function is memoized on `(nodes reference, query)`. The graph engine replaces the nodes array only on real graph changes, so recomputation follows edits for free. At the 180-node perf-test scale a full rebuild is negligible. Node dragging updates positions on every frame, so recomputation is deferred until the drag ends (on `nodeDragOriginGraph` clearing), or computed lazily only while search is open. Either option is acceptable; the index is cheap.

*Alternative:* reuse the cached per-node variable catalog in `store/expression-deps.ts`. Rejected as the primary source: it tracks dependency names, not occurrence offsets or field order. It can still serve as a fast pre-filter later if profiling asks for one.

### 3. Search state in a separate, non-history store slice

State shape: `{ isOpen, query, currentKey }`. The derived `matches`, `currentIndex` and per-node status are selectors, not stored state.

The state lives in the workflow store but outside `history`, so undo/redo never sees it and the nodes array is never rewritten.

Nodes subscribe with a narrow selector, `useNodeSearchStatus(nodeId): "none" | "match" | "current"`, compared by value. A node re-renders only when its own status flips, which satisfies the "unaffected nodes do not re-render" scenario.

*Alternatives:*
- Put a `searchMatch` flag into node data. Rejected: it rewrites nodes, touches history snapshots, and re-renders everything.
- A React context holding the matches. Rejected: every consumer re-renders on each step.

### 4. Current-match reconciliation by key

On every recompute:
- If `currentKey` still exists, keep it.
- If it does not, pick the first match whose sort position is after the old match's last known sort tuple.
- Otherwise fall back to the first match.
- If there are no matches, set `currentKey = null`.

The old sort tuple is remembered next to `currentKey`, so "nearest following" is well defined even after the old match is gone.

### 5. Reveal without selecting

Add a canvas-level `revealNode(nodeId)` next to the existing minimap `setCenter` usage. It:
- centers on the node's absolute position plus half its measured size;
- uses `zoom = max(currentZoom, MIN_READABLE_ZOOM)`, clamped to the workflow zoom bounds;
- uses the same 200 ms duration as the minimap.

`MIN_READABLE_ZOOM` is a named constant (proposed value 0.8).

Search and canvas need to share `revealNode`. Search may render outside `<ReactFlow>` in a custom composition, so `revealNode` is exposed through the editor layout context, or search is required to render inside the ReactFlow provider. Both options stay within this design. The existing layout provider is the preferred wiring.

Navigation deliberately does not call `setSelectedNode`: selection rewrites the nodes array (see Context). The explicit "select current" action calls `setSelectedNode(currentMatch.nodeId)` once.

### 6. Visual marks through `NodeShell` variants

Add a `searchState: "none" | "match" | "current"` variant to `NodeShell`'s `tv` definition:
- `match`: a subtle ring;
- `current`: a strong primary ring.

The variant composes with the existing `selected` styling. Per the package styling rules this uses `tv`, not `cn`. `DefaultNodeRenderer` receives the same prop, so kinds without a custom view are marked too.

### 7. UI and placement

A compact bar floating over the top-right of the canvas, built from `@flow/ui` input and button primitives. Its contents: input, `N / M`, previous and next buttons, a "select node" button, and close.

*Implementation note:* the bar is not a React Flow `<Panel>`. `WorkflowCanvas` owns its own `ReactFlowProvider` and takes no children, so a part composed next to `WorkflowEditor.Canvas` cannot render inside it. Instead `WorkflowEditor.Canvas` accepts children rendered over the canvas box (a size `@container`), and the default composition puts `WorkflowEditor.Search` there. The bar has a `placement` variant (`floating` by default, pinned top-right beside the palette toggle; `inline` for hosts that lay it out themselves), mirroring `WorkflowEditor.Palette`. While the floating palette is open and the canvas is at least 42rem wide, the bar moves left of it; a narrower canvas keeps it in the corner over the palette heading. It reaches the canvas only through the layout context's `revealNode`, so it also works as a sibling of the canvas in a custom composition.

`Mod+F` is taken over only while a search part is mounted. The editor root is focusable (`tabIndex=-1`) and takes focus on a pointer-down inside the editor when focus is elsewhere, so a click on empty canvas keeps focus inside the editor.

The React Flow UI `NodeSearch` component is not used. It is a pick-one combobox built on cmdk, and our `Command` is react-aria based.

The bar is exported as `WorkflowEditor.Search` and as the named export `WorkflowEditorSearch` (matching the other parts), and mounted in the default composition.

### 8. Hotkey scoping

- The `Mod+F` handler is attached to the editor root element, not `window`. It fires only when the event target is inside the editor. When it handles the key it calls `preventDefault()` to suppress browser find.
- It is registered in both edit and observe modes. The other hotkeys stay edit-only.
- The expression editor's `basicSetup` sets `searchKeymap: false`. The key then reaches the editor-root handler from inside CodeMirror fields, and the spec's "focus inside the editor" includes expression fields.
- `Enter` / `Shift+Enter` / `Escape` are handled on the search input only, so they never conflict with canvas hotkeys such as Escape-to-deselect.

## Risks / Trade-offs

- **[Risk]** Matching raw `{{…}}` text also hits non-variable identifiers inside expressions, for example function names or JSON keys in a path. → Acceptable for phase 1: it mirrors what the user sees in the field. A whole-word toggle in phase 2 narrows it.
- **[Risk]** Nodes can overlap in position, making spatial order ambiguous. → The sort falls back to node id, so the order is deterministic.
- **[Risk]** Disabling CodeMirror's `searchKeymap` removes find-within-field. → Expression fields are short, so the loss is minimal. Workflow search covers the use case at graph level.
- **[Risk]** Recomputing matches on every drag frame could cost frames on large graphs. → Defer recomputation until the drag ends (Decision 2).
- **[Trade-off]** Whole-node marks in phase 1 do not show which field matched. → Offsets are stored now, so phase-2 field and text highlighting needs no index changes.

## Open Questions

- Exact visual tokens for the match and current rings, and whether to dim non-matching nodes. This can be tuned during implementation without affecting the specs.
