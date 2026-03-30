import { addEdge } from "@xyflow/react"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { NodeKind } from "../node-registry/registry"
import type { WorkflowEdge, WorkflowGraphState, WorkflowNode } from "../types/types"
import { getKindsFromConnection, validateConnection, type ConnectionLike } from "../validation/validation"

import {
  collectDescendantNodeIds,
  getEdgeSplitInsertPosition,
  resolveSubgraphShiftX,
  shiftNodesBySubgraph,
} from "./geometry"
import { toEdgeConnectionWithKind } from "./dto-mappers"

export interface EdgeInsertionSuccess {
  ok: true
  nextNodes: WorkflowNode[]
  nextEdges: WorkflowEdge[]
  insertedNodeId: string
}

export interface EdgeInsertionFailure {
  ok: false
  error: string
}

export type EdgeInsertionResult = EdgeInsertionSuccess | EdgeInsertionFailure

export function computeEdgeInsertion(
  currentGraph: WorkflowGraphState,
  edgeId: string,
  kind: NodeKind,
  createNode: (currentNodes: WorkflowNode[], kind: NodeKind, position: { x: number; y: number }) => WorkflowNode = (
    _currentNodes,
    nextKind,
    position
  ) => createWorkflowNode(nextKind, position)
): EdgeInsertionResult {
  const edgeToSplit = currentGraph.edges.find((edge) => edge.id === edgeId)
  if (!edgeToSplit) {
    return { ok: false, error: "Failed to resolve edge for insertion." }
  }

  const sourceNode = currentGraph.nodes.find((node) => node.id === edgeToSplit.source)
  const targetNode = currentGraph.nodes.find((node) => node.id === edgeToSplit.target)
  if (!sourceNode || !targetNode) {
    return { ok: false, error: "Failed to resolve edge nodes for insertion." }
  }

  const shiftedNodes = computeShiftedLayout(currentGraph, edgeToSplit, sourceNode, targetNode)
  const finalSourceNode =
    shiftedNodes.find((node) => node.id === edgeToSplit.source) ?? sourceNode
  const finalTargetNode =
    shiftedNodes.find((node) => node.id === edgeToSplit.target) ?? targetNode
  const insertPosition = getEdgeSplitInsertPosition(finalSourceNode, finalTargetNode)
  const nextNode = createNode(shiftedNodes, kind, insertPosition)
  const nextNodes = [...shiftedNodes, nextNode]
  const nextEdgesBase = currentGraph.edges.filter((edge) => edge.id !== edgeToSplit.id)

  const sourceToInserted: ConnectionLike = {
    source: edgeToSplit.source,
    target: nextNode.id,
    sourceHandle: edgeToSplit.sourceHandle ?? null,
    targetHandle: null,
  }
  const insertedToTarget: ConnectionLike = {
    source: nextNode.id,
    target: edgeToSplit.target,
    sourceHandle: null,
    targetHandle: edgeToSplit.targetHandle ?? null,
  }

  const twoEdgeResult = tryTwoEdgeSplit(
    sourceToInserted,
    insertedToTarget,
    nextNodes,
    nextEdgesBase
  )
  if (twoEdgeResult) {
    return {
      ok: true,
      nextNodes,
      nextEdges: twoEdgeResult,
      insertedNodeId: nextNode.id,
    }
  }

  return tryFallbackSingleEdge(
    sourceToInserted,
    insertedToTarget,
    nextNodes,
    nextEdgesBase,
    currentGraph,
    nextNode.id
  )
}

function computeShiftedLayout(
  currentGraph: WorkflowGraphState,
  edgeToSplit: WorkflowEdge,
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode
): WorkflowNode[] {
  const targetSubgraphIds = collectDescendantNodeIds(edgeToSplit.target, currentGraph.edges)
  const initialInsertPosition = getEdgeSplitInsertPosition(sourceNode, targetNode)
  const initialShiftX = resolveSubgraphShiftX(
    currentGraph.nodes,
    targetSubgraphIds,
    initialInsertPosition
  )
  const initiallyShiftedNodes = shiftNodesBySubgraph(
    currentGraph.nodes,
    targetSubgraphIds,
    initialShiftX
  )
  const shiftedSourceNode =
    initiallyShiftedNodes.find((node) => node.id === edgeToSplit.source) ?? sourceNode
  const shiftedTargetNode =
    initiallyShiftedNodes.find((node) => node.id === edgeToSplit.target) ?? targetNode
  const centeredInsertPosition = getEdgeSplitInsertPosition(shiftedSourceNode, shiftedTargetNode)
  const extraShiftX = resolveSubgraphShiftX(
    initiallyShiftedNodes,
    targetSubgraphIds,
    centeredInsertPosition
  )
  return extraShiftX > 0
    ? shiftNodesBySubgraph(initiallyShiftedNodes, targetSubgraphIds, extraShiftX)
    : initiallyShiftedNodes
}

function tryTwoEdgeSplit(
  sourceToInserted: ConnectionLike,
  insertedToTarget: ConnectionLike,
  nextNodes: WorkflowNode[],
  nextEdgesBase: WorkflowEdge[]
): WorkflowEdge[] | null {
  const sourceValidation = validateConnection(sourceToInserted, nextNodes, nextEdgesBase)
  const targetValidation = validateConnection(insertedToTarget, nextNodes, nextEdgesBase)
  if (!sourceValidation.valid || !targetValidation.valid) return null

  const sourceKinds = getKindsFromConnection(sourceToInserted, nextNodes)
  const targetKinds = getKindsFromConnection(insertedToTarget, nextNodes)
  if (!sourceKinds || !targetKinds) return null

  const withSourceEdge = addEdge(
    toEdgeConnectionWithKind(sourceToInserted, sourceKinds.sourceKind, sourceKinds.targetKind),
    nextEdgesBase
  ) as WorkflowEdge[]
  return addEdge(
    toEdgeConnectionWithKind(insertedToTarget, targetKinds.sourceKind, targetKinds.targetKind),
    withSourceEdge
  ) as WorkflowEdge[]
}

function tryFallbackSingleEdge(
  sourceToInserted: ConnectionLike,
  insertedToTarget: ConnectionLike,
  nextNodes: WorkflowNode[],
  nextEdgesBase: WorkflowEdge[],
  currentGraph: WorkflowGraphState,
  insertedNodeId: string
): EdgeInsertionResult {
  const sourceValidation = validateConnection(sourceToInserted, nextNodes, nextEdgesBase)
  const targetValidation = validateConnection(insertedToTarget, nextNodes, nextEdgesBase)
  const fallbackValidation = validateConnection(insertedToTarget, nextNodes, nextEdgesBase)
  if (!fallbackValidation.valid) {
    const message =
      sourceValidation.reason ??
      targetValidation.reason ??
      fallbackValidation.reason ??
      "Invalid edge insertion."
    return { ok: false, error: message }
  }

  const fallbackKinds = getKindsFromConnection(insertedToTarget, nextNodes)
  if (!fallbackKinds) {
    return { ok: false, error: "Failed to resolve node kinds for edge insertion fallback." }
  }

  const fallbackEdges = addEdge(
    toEdgeConnectionWithKind(
      insertedToTarget,
      fallbackKinds.sourceKind,
      fallbackKinds.targetKind
    ),
    nextEdgesBase
  ) as WorkflowEdge[]

  return {
    ok: true,
    nextNodes,
    nextEdges: fallbackEdges,
    insertedNodeId,
  }
}
