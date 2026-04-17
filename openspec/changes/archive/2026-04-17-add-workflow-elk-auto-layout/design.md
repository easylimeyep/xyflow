## Context

The workflow editor currently stores graph state in the workflow Zustand store and renders the canvas as a controlled React Flow surface driven by `history.present.nodes`, `history.present.edges`, and viewport callbacks. Users can place nodes manually, use quick-add insertion helpers, and drag nodes around, but the editor has no way to reorganize a larger graph into a readable structure once the canvas becomes uneven.

This change is cross-cutting because it touches the React Flow canvas controls, workflow store command surface, graph history semantics, viewport behavior, and a new external dependency. The desired user experience is a manual "auto layout" action near the existing zoom controls that repositions the full graph in one step without changing workflow meaning.

The current graph model already gives us strong input for layouting:
- connections are validated as a DAG, so the layout engine can assume directed flow
- nodes already expose width/height defaults with runtime measurements available after mount
- edges retain `sourceHandle` and `targetHandle`, and branch nodes expose named outputs such as `branch-true` and `branch-false`

## Goals / Non-Goals

**Goals:**
- Add a manual auto-layout action to the workflow canvas controls.
- Compute a left-to-right layout for the current workflow using ELKjs.
- Apply layout as a single semantic history step so one undo restores the previous arrangement.
- Refit the viewport after a successful layout so users immediately see the reorganized graph.
- Keep the implementation aligned with the existing store-first graph mutation architecture.

**Non-Goals:**
- Trigger layout automatically after every add, connect, drag, import, or quick-add action.
- Animate node movement during the initial version.
- Support partial-subgraph layouting or per-selection layout in the first version.
- Replace React Flow controls, viewport ownership, or the existing history model.
- Expose ELK configuration as public API in the first version.

## Decisions

### Decision: Implement auto-layout as a store-level async graph command

The layout action should be modeled as an explicit workflow store command, for example `autoLayout()`, rather than as a React Flow local-state transformation in the canvas component.

Why this approach:
- It preserves the existing architecture where semantic graph mutations flow through the store.
- It allows the full repositioning pass to be committed as one undoable history entry.
- It keeps layout failure handling and graph mutation policy out of the UI layer.

Alternatives considered:
- Run ELK entirely inside `workflow-canvas` with local `setNodes`: rejected because the canvas does not own graph truth and this would bypass history semantics.
- Encode layout as synthetic `onNodesChange` events: rejected because ELK produces a whole-graph transform, not user-generated React Flow change events.

### Decision: Use ELKjs `layered` with a fixed left-to-right orientation for v1

The first version should use ELKjs with the layered algorithm and direction `RIGHT`.

Why this approach:
- It matches the editor's current visual grammar: target handles are on the left, outputs are on the right, and quick-add logic already extends subgraphs horizontally.
- It is the layout strategy closest to React Flow's own workflow template guidance.
- It produces predictable, readable workflow layouts without introducing user-facing configuration complexity on day one.

Alternatives considered:
- Dagre: simpler, but we specifically want the stronger handle-aware and workflow-oriented layout quality that motivated this change.
- User-selectable vertical/horizontal directions in v1: useful eventually, but adds API and test surface before the core feature proves itself.

### Decision: Map workflow handles to ELK ports from the start

The ELK adapter should translate workflow handles into ELK ports rather than treating every node as a single anonymous box connection point.

Why this approach:
- Branch nodes already have semantically meaningful named outputs (`branch-true`, `branch-false`) that benefit from stable port ordering.
- The React Flow team explicitly documents ELK multiple-handle integration as the path to lower crossing counts and better routing quality.
- Without ports, the first version would work, but branch-heavy flows would still produce avoidable ambiguity and edge crossings.

Design details:
- Nodes with a visible target handle get a synthetic left-side input port.
- Each defined output handle becomes a right-side ELK port with a stable id derived from the workflow handle id.
- Branch nodes use fixed-order right-side ports so `true` and `false` keep deterministic vertical ordering across layouts.
- Edges map their `sourceHandle` and `targetHandle` onto those port ids when available.

Alternatives considered:
- Start without ports and upgrade later: simpler implementation, but risks shipping a layout feature that feels weak exactly on the branch cases where users want help most.

### Decision: Separate ELK translation into dedicated layout helpers

The integration should live in a dedicated workflow layout module, not inline in the store slice or React component tree.

Why this approach:
- It keeps ELK-specific graph shaping and option mapping isolated from store orchestration.
- It makes pure layout translation easier to test without rendering React Flow.
- It creates a clean seam for future algorithm tuning without spreading ELK assumptions across the editor.

Likely structure:
- `workflow/layout/elk-layout.ts`: translate workflow graph to ELK input and return next positions
- `workflow/layout/elk-ports.ts`: handle and port id mapping helpers
- `workflow/layout/elk-options.ts`: shared layered defaults for v1

Alternatives considered:
- Inline helper inside a store slice: workable short-term, but harder to reason about and test as options evolve.

### Decision: Trigger layout from a custom control button and fit the viewport after success

The user entrypoint should be a custom button rendered inside React Flow `Controls`, near zoom actions. After the layout command completes successfully, the canvas should call `fitView`.

Why this approach:
- It matches the user's requested placement and keeps graph navigation actions grouped together.
- The canvas already owns `useReactFlow()` and is the natural place to call `fitView`.
- Reframing after layout avoids a confusing state where nodes move off-screen but the old viewport remains.

Alternatives considered:
- Add the action to the top editor toolbar instead: possible, but less discoverable for canvas positioning actions and farther from existing zoom/fit controls.
- Preserve the exact viewport after layout: rejected for v1 because users triggering auto-layout typically want to see the new full arrangement immediately.

### Decision: Treat auto-layout as a full-graph semantic mutation with failure rollback

If ELK layout succeeds, the resulting graph should be committed as one semantic update. If layout fails, the graph should remain untouched and the editor should surface an error through the existing `lastError` channel.

Why this approach:
- It matches current error/status handling patterns in the workflow store.
- It avoids partial graph movement or mixed local/store state after async failure.
- It preserves trust in undo/redo and keeps the feature predictable.

Alternatives considered:
- Partially commit whatever ELK returns before failure: rejected because the mutation boundary must remain atomic.

## Risks / Trade-offs

- [Risk] ELKjs adds async computation and a new dependency to the flow package. → Mitigation: keep the command user-triggered, guard against duplicate concurrent runs, and isolate dependency usage in a dedicated layout module.
- [Risk] Runtime node measurements may differ from fallback dimensions, which can slightly shift layout quality before all nodes are measured. → Mitigation: use measured `width`/`height` when available and fall back to existing defaults only when necessary.
- [Risk] Branch and multi-handle port mapping can drift from rendered handle definitions if encoded ad hoc. → Mitigation: derive port definitions from the same node registry/output metadata that drives rendered handles.
- [Risk] `fitView` after layout could feel jarring for users expecting the camera to stay fixed. → Mitigation: keep this behavior scoped to the explicit manual action and use consistent padding so the outcome feels intentional.
- [Risk] A full-graph layout can override careful manual adjustments. → Mitigation: keep the feature manual-only and make the entire operation reversible with one undo.

## Migration Plan

1. Add `elkjs` to `@workspace/flow`.
2. Introduce the layout adapter and workflow store command without changing existing add/connect/drag flows.
3. Add the canvas control button and success path that triggers viewport refit.
4. Land regression coverage for layout success, failure, history semantics, and viewport updates.
5. Rollback strategy: remove or disable the control button and stop invoking the store layout command; no persisted data migration is required because layout only changes runtime node positions already stored in the existing graph shape.

## Open Questions

- Should v1 preserve current node selection after layout, or should selection be cleared when the graph is recomputed? Preserving selection seems friendlier, but the implementation should make the policy explicit.
- Should `fitView` run unconditionally after every successful layout, or only when node bounds materially change? Unconditional fit is simpler and likely correct for v1.
- Do we want a loading or disabled state on the control button during ELK computation, or is duplicate-click guarding in logic sufficient? A visible disabled state would likely reduce confusion once we implement.
