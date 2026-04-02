import type { XYPosition } from "@xyflow/react"

import type { JsonObject, WorkflowNode, WorkflowNodeData } from "../types/types"
import { nodeRegistry, type NodeKind } from "./registry"

export const DEFAULT_NODE_WIDTH = 260
export const DEFAULT_NODE_HEIGHT = 80

export function createNodeId(kind: string): string {
  return `${kind}-${crypto.randomUUID()}`
}

function toNodeData(kind: NodeKind, label?: string): WorkflowNodeData {
  const definition = nodeRegistry[kind]
  if (!definition) {
    throw new Error(`Unknown node kind: ${kind}`)
  }

  return {
    kind,
    label: label ?? definition.title,
    config: definition.buildDefaultConfig() as JsonObject,
  }
}

export function createWorkflowNode(
  kind: NodeKind,
  position: XYPosition,
  label?: string
): WorkflowNode {
  return {
    id: createNodeId(kind),
    type: kind,
    position,
    width: DEFAULT_NODE_WIDTH,
    data: toNodeData(kind, label),
  }
}
