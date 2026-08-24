# `@flow/flow`

The core workflow editor — a node-based canvas built on
[`@xyflow/react`](https://reactflow.dev/) for authoring workflows by connecting
typed nodes.

```tsx
import { WorkflowEditor } from "@flow/flow"

export function Editor() {
  return <WorkflowEditor />
}
```

## Runtime observation mode

The same canvas can display a workflow **while it is running**, staying fully
read-only. This is opt-in and strictly additive: omit `mode` and `overlay` and
the editor behaves exactly as before.

```tsx
import {
  WorkflowEditor,
  type WorkflowRuntimeOverlay,
} from "@flow/flow"

// Your engine produces this. The package renders it and computes nothing.
const overlay: WorkflowRuntimeOverlay = {
  nodes: {
    "node-a": { status: "done", output: { count: 3 } },
    "node-b": { status: "running", iteration: { current: 2, total: 5 } },
    "node-c": { status: "failed", error: "timed out after 30s" },
    "node-d": { status: "waiting" },
    "node-e": { status: "skipped" },
  },
  activeEdgeIds: ["edge-b-c"],
  traversedEdgeIds: ["edge-a-b", "edge-b-c"],
}

export function RunView() {
  return (
    <WorkflowEditor initialGraph={graph} mode="observe" overlay={overlay} />
  )
}
```

In `mode="observe"`:

- Node dragging, connecting, deletion, duplication, the node palette, the
  context menu, and the editing hotkeys are all disabled. Pan, zoom, and node
  selection stay on.
- Each node renders a status treatment and, when present, a loop iteration
  counter (`2 / 3`); failed nodes show their error.
- Edges are styled by traversal: untouched, traversed, or active. An edge may be
  both traversed and active at once (e.g. inside a loop).
- Selecting a node opens a read-only inspector (input / output / error) in place
  of the config form.

### Overlay shape

```ts
type NodeRuntimeStatus =
  | "done"
  | "running"
  | "waiting"
  | "failed"
  | "skipped"

interface NodeRuntimeState {
  status: NodeRuntimeStatus
  iteration?: { current: number; total: number }
  input?: unknown
  output?: unknown
  error?: string
}

interface WorkflowRuntimeOverlay {
  nodes: Record<string, NodeRuntimeState> // may be partial
  activeEdgeIds: string[]
  traversedEdgeIds: string[]
}
```

`waiting` ("not reached yet") and `skipped` ("this branch was not taken") are
deliberately distinct so a branching run stays readable.

### Contract

- **Status computation is the consumer's responsibility.** The package does not
  run workflows, does not fetch anything, and never derives statuses. It renders
  the overlay it is handed.
- **The overlay is a prop, never store state.** Routing it through the store
  would place it on the undo history, letting a user's undo rewind a running
  workflow's display. It is passed to `WorkflowEditor` and flows to nodes and
  edges through a dedicated context.
- **The overlay may be partial.** A node id absent from `overlay.nodes` renders
  in its neutral authoring appearance, so an overlay can be streamed in as a run
  progresses.

### Performance

Nodes and edges read only their own slice of the overlay through a subscription
store, so a status change for a single node re-renders that node alone rather
than the whole canvas. On very large graphs, prefer updating the overlay in
batches over many tiny high-frequency updates.
