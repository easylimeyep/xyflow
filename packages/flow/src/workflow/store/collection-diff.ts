import type { EdgeChange, NodeChange } from "@xyflow/react"
import type { HistoryState } from "@workspace/store"

import type { WorkflowEdge, WorkflowGraphState, WorkflowNode } from "../types/types"

export function shouldCommitNodeHistory(
  changes: NodeChange<WorkflowNode>[]
): boolean {
  let hasStructuralChange = false
  let hasPositionChange = false
  let hasDraggingPosition = false
  for (const change of changes) {
    if (change.type !== "position") {
      hasStructuralChange = true
      continue
    }
    hasPositionChange = true
    if (change.dragging) hasDraggingPosition = true
  }
  if (hasStructuralChange) return true
  if (!hasPositionChange) return false
  return !hasDraggingPosition
}

export function shouldCommitEdgeHistory(
  changes: EdgeChange<WorkflowEdge>[]
): boolean {
  return changes.some((change) => change.type === "add" || change.type === "remove")
}

export function getRemovedNodeIds(
  changes: NodeChange<WorkflowNode>[]
): Set<string> {
  return new Set(changes.filter((c) => c.type === "remove").map((c) => c.id))
}

export function filterEdgesForRemovedNodes(
  edges: WorkflowEdge[],
  removedNodeIds: Set<string>
): WorkflowEdge[] {
  if (removedNodeIds.size === 0) return edges
  return edges.filter(
    (edge) => !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target)
  )
}

export function hasEdgeCollectionChanged(
  currentEdges: WorkflowEdge[],
  nextEdges: WorkflowEdge[]
): boolean {
  if (currentEdges.length !== nextEdges.length) return true
  for (let i = 0; i < currentEdges.length; i += 1) {
    if (currentEdges[i] !== nextEdges[i]) return true
  }
  return false
}

export function hasNodeCollectionChanged(
  currentNodes: WorkflowNode[],
  nextNodes: WorkflowNode[]
): boolean {
  if (currentNodes.length !== nextNodes.length) return true
  for (let i = 0; i < currentNodes.length; i += 1) {
    if (currentNodes[i] !== nextNodes[i]) return true
  }
  return false
}

function haveSameNodeIds(left: WorkflowNode[], right: WorkflowNode[]): boolean {
  if (left.length !== right.length) return false
  for (let i = 0; i < left.length; i += 1) {
    if (left[i]?.id !== right[i]?.id) return false
  }
  return true
}

function getRemovedEdgeIdSet(
  previousEdges: WorkflowEdge[],
  nextEdges: WorkflowEdge[]
): Set<string> {
  if (nextEdges.length >= previousEdges.length) return new Set()
  const nextEdgeIds = new Set(nextEdges.map((edge) => edge.id))
  const removedEdgeIds = new Set<string>()
  previousEdges.forEach((edge) => {
    if (!nextEdgeIds.has(edge.id)) removedEdgeIds.add(edge.id)
  })
  return removedEdgeIds
}

function getIncidentEdgeIdSet(
  edges: WorkflowEdge[],
  nodeIds: Set<string>
): Set<string> {
  const incidentEdgeIds = new Set<string>()
  if (nodeIds.size === 0) return incidentEdgeIds
  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) || nodeIds.has(edge.target)) {
      incidentEdgeIds.add(edge.id)
    }
  })
  return incidentEdgeIds
}

function areSetsEqual(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) return false
  for (const value of left) {
    if (!right.has(value)) return false
  }
  return true
}

export function shouldSquashPreviousEdgeRemovalWithNodeRemoval(
  history: HistoryState<WorkflowGraphState>,
  removedNodeIds: Set<string>
): boolean {
  if (removedNodeIds.size === 0 || history.past.length === 0) return false
  const previousGraph = history.past[history.past.length - 1]
  if (!previousGraph) return false
  const currentGraph = history.present
  if (!haveSameNodeIds(previousGraph.nodes, currentGraph.nodes)) return false
  const removedEdgeIds = getRemovedEdgeIdSet(previousGraph.edges, currentGraph.edges)
  if (removedEdgeIds.size === 0) return false
  const incidentEdgeIds = getIncidentEdgeIdSet(previousGraph.edges, removedNodeIds)
  return areSetsEqual(removedEdgeIds, incidentEdgeIds)
}

export function haveSameIdSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  for (const id of left) if (!rightSet.has(id)) return false
  return true
}

export function normalizeSelectionIds(nodeIds: string[]): string[] {
  if (nodeIds.length === 0) return []
  const uniqueNodeIds = [...new Set(nodeIds)]
  return uniqueNodeIds.sort((left, right) => left.localeCompare(right))
}

export function hasOutgoingConnection(
  edges: WorkflowEdge[],
  sourceNodeId: string,
  sourceHandle: string | null
): boolean {
  return edges.some(
    (edge) =>
      edge.source === sourceNodeId &&
      (edge.sourceHandle ?? null) === (sourceHandle ?? null)
  )
}
