## Context

The workflow ELK layout adapter already uses `node.measured` dimensions when React Flow has reported them, and falls back to node-kind estimates otherwise. That works for manual auto-layout after the canvas is mounted, but not for initial graph construction because `createInitialGraphElk` runs before nodes exist in the DOM.

The large ELK example exposes the gap: the `Set approval` node has a long `valueExpression`, so its rendered height is much larger than the fallback `setVariable` estimate. ELK receives the smaller height and places downstream nodes too close.

## Goals / Non-Goals

**Goals:**

- Add an explicit `WorkflowEditor` opt-in prop, `autoLayoutOnInit="after-measure"`.
- Let React Flow render and measure the initial graph before running the first ELK layout.
- Hide the measuring/bootstrap phase behind a loader or canvas initializing state.
- Reuse the existing ELK auto-layout pipeline after measured dimensions are available.
- Apply the initial measured layout without adding an undo/redo history entry.
- Preserve existing default behavior when the prop is omitted.

**Non-Goals:**

- Do not replace `createInitialGraphElk`; it remains useful outside mounted React editors.
- Do not auto-layout after every node content edit.
- Do not introduce offscreen custom DOM measurement separate from React Flow.
- Do not change manual auto-layout history semantics.

## Decisions

### Add an explicit opt-in editor prop

`WorkflowEditorProps` will gain `autoLayoutOnInit?: "after-measure"`.

The default omitted value preserves the current initialization path. The string literal leaves room for future modes without turning the prop into a boolean whose meaning may become overloaded.

Alternative considered: automatically run measured layout for every initial graph. Rejected because some consumers may intentionally provide positions, and automatic layout could surprise existing users.

### Use React Flow measurement as the source of truth

When the prop is set, the editor mounts the provided `initialGraph` with provisional positions and waits until React Flow reports node dimensions for all nodes. The implementation should use React Flow's initialization/measurement signal, such as `useNodesInitialized`, or the existing `dimensions` updates in store if that integrates more cleanly.

Alternative considered: estimate node dimensions from config text. This remains useful as a fallback, but it cannot perfectly match real CSS, wrapping, editor chrome, or future node renderers.

### Run a bootstrap layout action, not the user auto-layout action

Measured initial layout should call the same pure layout engine used by manual auto-layout, but apply the result with a store action dedicated to initialization. That action replaces `history.present` and clears `future` without pushing the previous provisional graph into `history.past`.

Alternative considered: call the existing `autoLayout()` action. Rejected because it would make the first Undo restore the hidden provisional layout.

### Keep the canvas measurable while hidden from the user

The editor should keep React Flow mounted and measurable during initialization. The UI can cover the canvas with an overlay or keep the flow layer visually hidden with opacity, but it must not use `display: none` for measured content.

Alternative considered: render a separate hidden measurement canvas. Rejected because it duplicates editor mounting, store wiring, and node renderer behavior.

### Failure reveals the editor instead of blocking indefinitely

If measurement never becomes ready or ELK layout fails, the editor should clear the initializing state, preserve the current graph, and surface the existing layout error mechanism when available. The user can still interact with the graph and run manual auto-layout later.

## Risks / Trade-offs

- [Initialization appears slower for large graphs] -> Show an explicit loader and run this only when `autoLayoutOnInit="after-measure"` is requested.
- [Measurement signal never resolves for an empty graph or hidden container] -> Treat empty graphs as already initialized and avoid hiding measured content with `display: none`.
- [Strict Mode or remounts trigger duplicate layout] -> Track that the initial measured layout has already been attempted for the mounted store.
- [User-provided positions are overwritten] -> Make the feature opt-in and document that it is for initial measured ELK placement.
- [Layout failure leaves provisional positions] -> Reveal the editor and preserve graph state rather than blocking the canvas.

## Migration Plan

No migration is required. Existing consumers keep current behavior unless they pass `autoLayoutOnInit="after-measure"`.
