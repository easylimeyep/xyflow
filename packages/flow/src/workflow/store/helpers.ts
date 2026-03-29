import type { EdgeChange, NodeChange, Viewport, XYPosition } from "@xyflow/react"
import { cloneDeep } from "es-toolkit/object"

import {
  createHistoryState,
  pushHistoryState,
  type HistoryState,
} from "@workspace/store"

import { DEFAULT_NODE_WIDTH, normalizeNodeConfig } from "../node-registry/node-registry"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowNodeDTO,
  NodeKind,
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowNode,
} from "../types/types"
import type { ConnectionLike } from "../validation/validation"

import type { WorkflowStoreSetState } from "./types"

export function cloneGraphState(graph: WorkflowGraphState): WorkflowGraphState {
  return cloneDeep(graph)
}

export function createInitialHistory(graph: WorkflowGraphState): HistoryState<WorkflowGraphState> {
  return createHistoryState(cloneGraphState(graph))
}

export function commitGraphState(
  set: WorkflowStoreSetState,
  nextGraph: WorkflowGraphState
): void {
  set((state) => ({
    history: pushHistoryState(state.history, cloneGraphState(nextGraph)),
  }))
}

export function replacePresentGraphState(
  set: WorkflowStoreSetState,
  nextGraph: WorkflowGraphState
): void {
  set((state) => ({
    history: {
      ...state.history,
      present: cloneGraphState(nextGraph),
    },
  }))
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

function getQuickAddSourceAnchorY(
  sourceNode: WorkflowNode,
  sourceHandle: string | null
): number {
  const nodeHeight = sourceNode.height ?? 80
  const baseY = sourceNode.position.y
  if (sourceHandle === "branch-true") return baseY + nodeHeight * 0.34
  if (sourceHandle === "branch-false") return baseY + nodeHeight * 0.72
  return baseY + nodeHeight / 2
}

function getNodeRect(node: WorkflowNode): {
  left: number
  right: number
  top: number
  bottom: number
} {
  const width = node.width ?? DEFAULT_NODE_WIDTH
  const height = node.height ?? 80
  return {
    left: node.position.x,
    right: node.position.x + width,
    top: node.position.y,
    bottom: node.position.y + height,
  }
}

function hasPlacementCollision(
  existingNodes: WorkflowNode[],
  candidatePosition: XYPosition,
  margin = 24
): boolean {
  const candidateRect = {
    left: candidatePosition.x,
    right: candidatePosition.x + DEFAULT_NODE_WIDTH,
    top: candidatePosition.y,
    bottom: candidatePosition.y + 80,
  }
  return existingNodes.some((node) => {
    const rect = getNodeRect(node)
    return !(
      candidateRect.right + margin < rect.left ||
      candidateRect.left - margin > rect.right ||
      candidateRect.bottom + margin < rect.top ||
      candidateRect.top - margin > rect.bottom
    )
  })
}

export function createSmartQuickAddPosition(
  nodes: WorkflowNode[],
  sourceNode: WorkflowNode,
  sourceHandle: string | null
): XYPosition {
  const sourceWidth = sourceNode.width ?? DEFAULT_NODE_WIDTH
  const sourceAnchorY = getQuickAddSourceAnchorY(sourceNode, sourceHandle)
  const baseX = sourceNode.position.x + sourceWidth + 180
  const candidateOffsets = [0, -140, 140, -280, 280, -420, 420]
  for (const offsetY of candidateOffsets) {
    const candidate = { x: baseX, y: sourceAnchorY - 40 + offsetY }
    if (!hasPlacementCollision(nodes, candidate)) return candidate
  }
  return { x: baseX, y: sourceAnchorY + 480 }
}

function getNodeCenter(node: WorkflowNode): XYPosition {
  const width = node.width ?? DEFAULT_NODE_WIDTH
  const height = node.height ?? 80
  return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
}

function createNodeRectAtPosition(position: XYPosition): {
  left: number
  right: number
  top: number
  bottom: number
} {
  return {
    left: position.x,
    right: position.x + DEFAULT_NODE_WIDTH,
    top: position.y,
    bottom: position.y + 80,
  }
}

export function getEdgeSplitInsertPosition(
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode
): XYPosition {
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)
  const centerX = sourceCenter.x + (targetCenter.x - sourceCenter.x) / 2
  const centerY = sourceCenter.y + (targetCenter.y - sourceCenter.y) / 2
  return { x: centerX - DEFAULT_NODE_WIDTH / 2, y: centerY - 40 }
}

export function collectDescendantNodeIds(
  startNodeId: string,
  edges: WorkflowEdge[]
): Set<string> {
  const descendants = new Set<string>()
  const queue = [startNodeId]
  while (queue.length > 0) {
    const currentNodeId = queue.shift()
    if (!currentNodeId || descendants.has(currentNodeId)) continue
    descendants.add(currentNodeId)
    edges.forEach((edge) => {
      if (edge.source === currentNodeId && !descendants.has(edge.target)) {
        queue.push(edge.target)
      }
    })
  }
  return descendants
}

export function shiftNodesBySubgraph(
  nodes: WorkflowNode[],
  subgraphNodeIds: Set<string>,
  shiftX: number
): WorkflowNode[] {
  if (shiftX <= 0 || subgraphNodeIds.size === 0) return nodes
  return nodes.map((node) => {
    if (!subgraphNodeIds.has(node.id)) return node
    return { ...node, position: { x: node.position.x + shiftX, y: node.position.y } }
  })
}

export function resolveSubgraphShiftX(
  nodes: WorkflowNode[],
  subgraphNodeIds: Set<string>,
  insertPosition: XYPosition,
  margin = 80
): number {
  if (subgraphNodeIds.size === 0) return 0
  const candidateRect = createNodeRectAtPosition(insertPosition)
  let requiredShift = 0
  nodes.forEach((node) => {
    if (!subgraphNodeIds.has(node.id)) return
    const rect = getNodeRect(node)
    const overlapsVertically =
      candidateRect.bottom + margin >= rect.top &&
      candidateRect.top - margin <= rect.bottom
    if (!overlapsVertically) return
    const overlapDistance = candidateRect.right + margin - rect.left
    if (overlapDistance > requiredShift) requiredShift = overlapDistance
  })
  return requiredShift > 0 ? requiredShift : 0
}

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

export function getFallbackPasteAnchor(viewport: Viewport): XYPosition {
  const safeZoom = viewport.zoom === 0 ? 1 : viewport.zoom
  return {
    x: (-viewport.x + 120) / safeZoom,
    y: (-viewport.y + 120) / safeZoom,
  }
}

export function createUniqueLabel(baseLabel: string, usedLabels: Set<string>): string {
  const trimmedBase = baseLabel.trim() || "Node"
  if (!usedLabels.has(trimmedBase)) {
    usedLabels.add(trimmedBase)
    return trimmedBase
  }
  let suffix = 2
  while (usedLabels.has(`${trimmedBase} ${suffix}`)) suffix += 1
  const uniqueLabel = `${trimmedBase} ${suffix}`
  usedLabels.add(uniqueLabel)
  return uniqueLabel
}

export function createUniqueJsIdentifier(
  baseName: string,
  usedIdentifiers: Set<string>
): string {
  const trimmedBase = baseName.trim()
  const baseIdentifier = trimmedBase.length > 0 ? trimmedBase : "myVar"
  if (!usedIdentifiers.has(baseIdentifier)) {
    usedIdentifiers.add(baseIdentifier)
    return baseIdentifier
  }
  let suffix = 2
  while (usedIdentifiers.has(`${baseIdentifier}${suffix}`)) suffix += 1
  const uniqueIdentifier = `${baseIdentifier}${suffix}`
  usedIdentifiers.add(uniqueIdentifier)
  return uniqueIdentifier
}

export function getSetVariableNames(nodes: WorkflowNode[]): Set<string> {
  const usedVariableNames = new Set<string>()
  nodes.forEach((node) => {
    if (node.data.kind !== "setVariable") return
    const variableNameValue = node.data.config.variableName
    if (typeof variableNameValue !== "string") return
    const trimmedName = variableNameValue.trim()
    if (trimmedName.length > 0) usedVariableNames.add(trimmedName)
  })
  return usedVariableNames
}

export async function writeTextToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    typeof navigator.clipboard.writeText !== "function"
  ) {
    return false
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export async function readTextFromClipboard(): Promise<string | null> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    typeof navigator.clipboard.readText !== "function"
  ) {
    return null
  }
  try {
    const text = await navigator.clipboard.readText()
    return typeof text === "string" ? text : null
  } catch {
    return null
  }
}

export function asDomainNodeDTO(node: WorkflowNode): DomainWorkflowNodeDTO {
  return {
    id: node.id,
    kind: node.data.kind,
    position: { ...node.position },
    label: node.data.label,
    config: normalizeNodeConfig(node.data.kind, node.data.config),
  }
}

export function asDomainConnectionDTO(
  edge: WorkflowEdge
): DomainWorkflowConnectionDTO {
  return {
    id: edge.id,
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
  }
}

export function toEdgeConnectionWithKind(
  connection: ConnectionLike,
  sourceKind: NodeKind,
  targetKind: NodeKind
) {
  return {
    ...connection,
    sourceHandle: connection.sourceHandle ?? null,
    targetHandle: connection.targetHandle ?? null,
    data: {
      sourceKind,
      targetKind,
    },
  }
}
