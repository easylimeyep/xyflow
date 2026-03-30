import type { NodeKind } from "../types/types"
import { workflowNodeRegistry } from "./node-definitions"

export function getNodeDefinition(kind: NodeKind) {
  return workflowNodeRegistry[kind]
}

export { workflowNodeRegistry }
