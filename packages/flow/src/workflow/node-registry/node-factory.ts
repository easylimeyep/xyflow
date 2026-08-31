import type { XYPosition } from "@xyflow/react"

import type { JsonObject, WorkflowNode, WorkflowNodeData } from "../types/types"
import type { NodeKind, NodeRegistry } from "./registry"

export const DEFAULT_NODE_WIDTH = 260
export const DEFAULT_NODE_HEIGHT = 80

export function createNodeId(kind: string): string {
  return `${kind}-${crypto.randomUUID()}`
}

function toNodeData(
  registry: NodeRegistry,
  kind: NodeKind,
  label?: string
): WorkflowNodeData {
  const definition = registry.get(kind)
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
  registry: NodeRegistry,
  kind: NodeKind,
  position: XYPosition,
  label?: string
): WorkflowNode {
  return {
    id: createNodeId(kind),
    type: kind,
    position,
    width: DEFAULT_NODE_WIDTH,
    data: toNodeData(registry, kind, label),
  }
}
