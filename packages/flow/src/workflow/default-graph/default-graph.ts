import type { Viewport } from "@xyflow/react"

import type { WorkflowGraphState } from "../types/types"

export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

/**
 * What the store starts with when a host mounts the editor without a graph.
 *
 * Empty, and necessarily so: the node vocabulary belongs to the consumer now
 * (see the node registry), so the package has no kind it may legitimately seed
 * a document with. It used to open on a `inlineExpression` root, which both
 * assumed that kind was registered — a module-scope throw once it is not — and
 * put a node the host never asked for into every fresh document.
 *
 * A host that wants a starting shape passes `initialGraph`. The keyword graph
 * this used to hold now lives in {@link createKeywordSampleGraph}, for the demo
 * app and the suites that need a populated document.
 */
export const initialWorkflowGraph: WorkflowGraphState = {
  nodes: [],
  edges: [],
  viewport: DEFAULT_VIEWPORT,
  document: {
    id: "workflow-local",
    name: "Untitled Workflow",
    version: 1,
    metadata: { source: "ui" },
  },
}
