import { nodeRegistry, type NodeKind } from "./registry"

export function getAllowedTargets(kind: NodeKind): string[] {
  return nodeRegistry[kind].allowedTargets
}

export function getNodeOutputPaths(kind: NodeKind): string[] {
  return nodeRegistry[kind].outputPaths
}
