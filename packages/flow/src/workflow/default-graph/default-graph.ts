import type { Viewport } from "@xyflow/react"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { WorkflowGraphState } from "../types/types"

export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

const triggerNode = createWorkflowNode("trigger", { x: 0, y: 80 }, "File Trigger")

export const initialWorkflowGraph: WorkflowGraphState = {
  nodes: [triggerNode],
  edges: [],
  viewport: DEFAULT_VIEWPORT,
  document: {
    id: "workflow-local",
    name: "Untitled Workflow",
    version: 1,
    metadata: { source: "ui" },
  },
}
