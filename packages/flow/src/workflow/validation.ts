import type { Connection } from "@xyflow/react"

import { workflowNodeRegistry } from "./node-registry"
import type { NodeKind, WorkflowEdge, WorkflowNode } from "./types"

export interface ValidationResult {
  valid: boolean
  reason?: string
}

export type ConnectionLike = Pick<Connection, "source" | "target"> & {
  sourceHandle?: string | null
  targetHandle?: string | null
}

function hasPath(
  adjacency: Map<string, string[]>,
  startNodeId: string,
  targetNodeId: string
): boolean {
  const queue: string[] = [startNodeId]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    if (current === targetNodeId) {
      return true
    }

    if (visited.has(current)) {
      continue
    }

    visited.add(current)
    const neighbors = adjacency.get(current) ?? []
    queue.push(...neighbors)
  }

  return false
}

function wouldCreateCycle(
  edges: WorkflowEdge[],
  sourceNodeId: string,
  targetNodeId: string
): boolean {
  if (sourceNodeId === targetNodeId) {
    return true
  }

  const adjacency = new Map<string, string[]>()

  for (const edge of edges) {
    const existingTargets = adjacency.get(edge.source) ?? []
    existingTargets.push(edge.target)
    adjacency.set(edge.source, existingTargets)
  }

  const pendingTargets = adjacency.get(sourceNodeId) ?? []
  pendingTargets.push(targetNodeId)
  adjacency.set(sourceNodeId, pendingTargets)

  return hasPath(adjacency, targetNodeId, sourceNodeId)
}

export function validateConnection(
  connection: ConnectionLike,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationResult {
  if (!connection.source || !connection.target) {
    return {
      valid: false,
      reason: "Connection is missing source or target node.",
    }
  }

  const sourceNode = nodes.find((node) => node.id === connection.source)
  const targetNode = nodes.find((node) => node.id === connection.target)

  if (!sourceNode || !targetNode) {
    return {
      valid: false,
      reason: "Connection references an unknown node.",
    }
  }

  const sourceKind = sourceNode.data.kind
  const targetKind = targetNode.data.kind
  const allowedTargets = workflowNodeRegistry[sourceKind].allowedTargets

  if (!allowedTargets.includes(targetKind)) {
    return {
      valid: false,
      reason: `${sourceKind} node cannot connect to ${targetKind} node.`,
    }
  }

  const duplicate = edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      edge.sourceHandle === (connection.sourceHandle ?? null) &&
      edge.targetHandle === (connection.targetHandle ?? null)
  )

  if (duplicate) {
    return {
      valid: false,
      reason: "Connection already exists.",
    }
  }

  if (wouldCreateCycle(edges, connection.source, connection.target)) {
    return {
      valid: false,
      reason: "Connection creates a cycle.",
    }
  }

  return { valid: true }
}

export function getKindsFromConnection(
  connection: ConnectionLike,
  nodes: WorkflowNode[]
): { sourceKind: NodeKind; targetKind: NodeKind } | null {
  if (!connection.source || !connection.target) {
    return null
  }

  const sourceNode = nodes.find((node) => node.id === connection.source)
  const targetNode = nodes.find((node) => node.id === connection.target)
  if (!sourceNode || !targetNode) {
    return null
  }

  return {
    sourceKind: sourceNode.data.kind,
    targetKind: targetNode.data.kind,
  }
}
