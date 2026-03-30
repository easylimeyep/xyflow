import type { XYPosition } from "@xyflow/react"

import type { NodeKind, WorkflowNode, WorkflowNodeData } from "../types/types"
import { workflowNodeRegistry } from "./node-definitions"

export const DEFAULT_NODE_WIDTH = 260

export function createNodeId(kind: NodeKind): string {
  return `${kind}-${crypto.randomUUID()}`
}

function toNodeData<K extends NodeKind>(kind: K, label?: string): WorkflowNodeData {
  const definition = workflowNodeRegistry[kind]
  if (!definition) {
    throw new Error(`Unknown node kind: ${kind}`)
  }

  return {
    kind,
    label: label ?? definition.title,
    config: definition.buildDefaultConfig(),
  }
}

export function createWorkflowNode<K extends NodeKind>(
  kind: K,
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
