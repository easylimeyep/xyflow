## Context

`WorkflowCanvas` is built for authoring: nodes are draggable, `NodeConfigPanel` edits the selected
node's config, and the store commits every interaction through the history slices. A consumer that
wants to display a running workflow has no seam to hook into — it would have to fork the canvas.

The package already separates node *definition* (`node-registry/define-node.ts`) from node
*rendering* (`node-registry/view-registry.tsx`), with `NodeShell` as the shared visual wrapper. That
separation is what makes this change an addition rather than a rewrite: runtime status lands on
`NodeShell` once and every registered node kind inherits it, including kinds registered by
consumers.

## Goals / Non-Goals

**Goals**
- One canvas serves both authoring and observation.
- Runtime state enters as a plain view-time prop and never touches the graph model or history.
- Consumers register their own node kinds and still get status rendering for free.

**Non-Goals**
- Executing workflows. Status computation belongs entirely to the consumer.
- Any change to serialization, DTOs, or persisted graph shape.
- Any change to cycle handling — see `2026-06-23-allow-cyclic-workflows`.

## Decisions

### Overlay is a prop, not store state

The overlay is passed to the canvas and flows to nodes through React context, not through the
workflow store.

Putting it in the store would push it into the history slices, so an incoming status update would
land on the undo stack and a user's undo could "rewind" a running workflow's display. It would also
make the overlay serializable state, inviting it into exports. A prop keeps runtime display strictly
outside the graph model.

The trade-off is one more context provider; the alternative silently corrupts undo semantics.

### `mode` gates behaviour, not a separate component

`mode?: "edit" | "observe"` defaults to `"edit"`, so existing consumers are untouched.

A separate `ObserveCanvas` component would duplicate the ReactFlow wiring, node types, edge types,
layout, and viewport handling — and would drift from the editor with every change. Gating the
mutation affordances in one place keeps a single canvas.

In `observe` mode: `nodesDraggable`, `nodesConnectable`, `elementsSelectable` for edges, and the
delete/duplicate context-menu entries are off; `panOnDrag` and zoom stay on. Node *selection* stays
on, because selecting a node is how the inspector opens.

### Status lives on `NodeShell`, not on each node component

`NodeShell` already wraps every node's visual frame. Rendering the status ring, badge, and iteration
counter there means the five node kinds in this package and every consumer-registered kind get
identical treatment with no per-kind work.

Per-node rendering would guarantee inconsistency the moment a consumer adds a kind.

### Statuses are a closed set

`"done" | "running" | "waiting" | "failed" | "skipped"`.

`skipped` is deliberately distinct from `waiting`: a viewer must be able to tell "not reached yet"
from "this branch was not taken". Collapsing them makes a branching workflow unreadable, which is
the main thing this feature exists to show.

### Edge traversal is two lists, not a per-edge status

`traversedEdgeIds` and `activeEdgeIds`. An edge inside a loop can be both traversed and active at
once, which a single enum could not express.

## Runtime overlay shape

```ts
export type NodeRuntimeStatus =
  | "done"
  | "running"
  | "waiting"
  | "failed"
  | "skipped"

export interface NodeRuntimeState {
  status: NodeRuntimeStatus
  iteration?: { current: number; total: number }
  input?: unknown
  output?: unknown
  error?: string
}

export interface WorkflowRuntimeOverlay {
  nodes: Record<string, NodeRuntimeState>
  activeEdgeIds: string[]
  traversedEdgeIds: string[]
}
```

A node id absent from `overlay.nodes` renders in its neutral authoring appearance — the overlay is
allowed to be partial, so a consumer can stream it in as a workflow progresses.

## Styling

Per `AGENTS.md`, `packages/flow` composes classes with `tv` from `tailwind-variants` and must not
import `cn`. Status styling is added as a `tv` variant on the existing `node-shell.styles.ts` slots,
and edge traversal styling as a variant on `workflow-edge.styles.ts` — no new styling mechanism.

## Risks / Trade-offs

- **Large graphs.** Every node re-renders when the overlay object identity changes. Mitigation: nodes
  read their own entry through a selector-style context read, so an update to one node's status does
  not re-render the rest.
- **Mode drift.** A future editing affordance could be added without gating it. Mitigation: the
  Playwright smoke test asserts the graph is unchanged after attempting drag, delete, and connect in
  `observe` mode, so an ungated affordance fails CI.
- **Inspector payload size.** `input`/`output` are arbitrary consumer data. The inspector renders
  them as collapsed JSON with a size cap rather than expanding unbounded structures.

## Migration

None. `mode` defaults to `"edit"` and `overlay` is optional; omitting both reproduces today's
behaviour exactly.
