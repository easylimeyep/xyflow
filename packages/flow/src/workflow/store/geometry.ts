import type { XYPosition } from "@xyflow/react"

import { DEFAULT_NODE_WIDTH } from "../node-registry/node-factory"
import type { WorkflowNode } from "../types/types"

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

export function getNodeRect(node: WorkflowNode): {
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
  edges: { source: string; target: string }[]
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
