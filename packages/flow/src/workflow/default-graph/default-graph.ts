import type { Viewport } from "@xyflow/react"

import { createWorkflowNode } from "../node-registry/node-registry"
import type { WorkflowGraphState } from "../types/types"

export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

const triggerNode = createWorkflowNode("trigger", { x: 0, y: 80 }, "File Trigger")
const transformNode = createWorkflowNode("transform", { x: 360, y: 80 }, "Parse Config")

export const initialWorkflowGraph: WorkflowGraphState = {
  nodes: [triggerNode, transformNode],
  edges: [
    {
      id: `${triggerNode.id}-${transformNode.id}`,
      source: triggerNode.id,
      target: transformNode.id,
      sourceHandle: null,
      targetHandle: null,
      data: {
        sourceKind: "trigger",
        targetKind: "transform",
      },
    },
  ],
  viewport: DEFAULT_VIEWPORT,
  document: {
    id: "workflow-local",
    name: "Untitled Workflow",
    version: 1,
    metadata: { source: "ui" },
  },
}
