import type { NodeKind } from "../types/types"
import { workflowNodeRegistry } from "./node-definitions"

export function getAllowedTargets(kind: NodeKind): NodeKind[] {
  return workflowNodeRegistry[kind].allowedTargets
}

export function getNodeOutputPaths(kind: NodeKind): string[] {
  return workflowNodeRegistry[kind].outputPaths
}
