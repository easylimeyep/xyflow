import { addEdge, applyNodeChanges, type NodeChange } from "@xyflow/react"
import { pushHistoryState } from "@workspace/store"

import { createWorkflowError } from "../../types/errors"
import type { WorkflowEdge, WorkflowGraphState, WorkflowNode } from "../../types/types"
import { getKindsFromConnection, validateConnection, type ConnectionLike } from "../../validation/validation"
import {
  filterEdgesForRemovedNodes,
  getRemovedNodeIds,
  hasEdgeCollectionChanged,
  hasNodeCollectionChanged,
  hasOutgoingConnection,
  haveSameIdSet,
  shouldCommitNodeHistory,
  shouldSquashPreviousEdgeRemovalWithNodeRemoval,
} from "../collection-diff"
import { toEdgeConnectionWithKind } from "../dto-mappers"
import { computeEdgeInsertion } from "../edge-insertion"
import { buildExpressionSlicePatch } from "../expression-deps"
import { createSmartQuickAddPosition } from "../geometry"
import { cloneGraphState, commitGraphState } from "../history-helpers"
import { projectSelectionToNodes } from "../selection-sync"
import type { WorkflowSliceCreator } from "../types"
import { createNodeWithUniqueLabel } from "./node-crud-slice"

export const createGraphSlice: WorkflowSliceCreator = (set, get) => ({
  confirmQuickAddNode: (kind) => {
    const currentGraph = get().history.present
    const pending = get().quickAddPending
    if (!pending) return

    const sourceNode = currentGraph.nodes.find((node) => node.id === pending.sourceNodeId)
    if (!sourceNode) {
      set({
        quickAddPending: null,
        lastError: createWorkflowError("NODE_NOT_FOUND", "Failed to resolve source node for quick add."),
      })
      return
    }

    if (hasOutgoingConnection(currentGraph.edges, pending.sourceNodeId, pending.sourceHandle)) {
      set({
        quickAddPending: null,
        lastError: createWorkflowError("OUTGOING_CONNECTION_EXISTS", "Selected output already has an outgoing connection."),
      })
      return
    }

    const nextNodePosition = createSmartQuickAddPosition(
      currentGraph.nodes,
      sourceNode,
      pending.sourceHandle
    )
    const nextNode = createNodeWithUniqueLabel(currentGraph.nodes, kind, nextNodePosition)
    const nextNodes = [...currentGraph.nodes, nextNode]
    const connection: ConnectionLike = {
      source: pending.sourceNodeId,
      target: nextNode.id,
      sourceHandle: pending.sourceHandle,
      targetHandle: null,
    }
    const validation = validateConnection(connection, nextNodes, currentGraph.edges)
    if (!validation.valid) {
      set({ lastError: createWorkflowError("INVALID_CONNECTION", validation.reason ?? "Invalid quick add connection.") })
      return
    }

    const kinds = getKindsFromConnection(connection, nextNodes)
    if (!kinds) {
      set({ lastError: createWorkflowError("KIND_RESOLUTION_FAILED", "Failed to resolve node kinds for quick add connection.") })
      return
    }

    const nextEdges = addEdge(
      toEdgeConnectionWithKind(connection, kinds.sourceKind, kinds.targetKind),
      currentGraph.edges
    ) as WorkflowEdge[]

    commitGraphState(set, { ...currentGraph, nodes: nextNodes, edges: nextEdges })
    set((state) => ({
      quickAddPending: null,
      selectedNodeIds: [nextNode.id],
      history: {
        ...state.history,
        present: {
          ...state.history.present,
          nodes: projectSelectionToNodes(state.history.present.nodes, [nextNode.id]),
        },
      },
      lastError: null,
    }))
  },
  confirmEdgeInsertNode: (kind) => {
    const currentGraph = get().history.present
    const pending = get().edgeInsertPending
    if (!pending) return

    const result = computeEdgeInsertion(currentGraph, pending.edgeId, kind, createNodeWithUniqueLabel)
    if (!result.ok) {
      set({ edgeInsertPending: null, lastError: createWorkflowError("EDGE_INSERT_FAILED", result.error) })
      return
    }

    commitGraphState(set, { ...currentGraph, nodes: result.nextNodes, edges: result.nextEdges })
    set((state) => ({
      edgeInsertPending: null,
      selectedNodeIds: [result.insertedNodeId],
      history: {
        ...state.history,
        present: {
          ...state.history.present,
          nodes: projectSelectionToNodes(state.history.present.nodes, [result.insertedNodeId]),
        },
      },
      lastError: null,
    }))
  },
  onNodesChange: (changes) => {
    const history = get().history
    const currentGraph = history.present
    const computed = computeNextGraphFromNodeChanges(currentGraph, changes, get().selectedNodeIds)
    const { nextGraph, removedNodeIds, nodeCollectionChanged, edgeCollectionChanged, selectionChanged, nextSelectedNodeIds } = computed
    const hasDraggingPositionChanges = hasDraggingPositionChange(changes)

    if (!nodeCollectionChanged && !edgeCollectionChanged && !selectionChanged) {
      if (!hasDraggingPositionChanges && get().nodeDragOriginGraph) {
        set({ nodeDragOriginGraph: null })
      }
      return
    }

    if (shouldCommitNodeHistory(changes)) {
      if (shouldSquashPreviousEdgeRemovalWithNodeRemoval(history, removedNodeIds)) {
        set((state) => ({
          history: { ...state.history, present: cloneGraphState(nextGraph), future: [] },
          selectedNodeIds: nextSelectedNodeIds,
          nodeDragOriginGraph: null,
          ...buildExpressionSlicePatch(state, nextGraph),
        }))
        return
      }

      if (isPositionOnlyChange(changes)) {
        const dragOriginGraph = get().nodeDragOriginGraph ?? currentGraph
        if (!haveNodePositionsChanged(dragOriginGraph.nodes, nextGraph.nodes)) {
          set((state) => ({
            history: { ...state.history, present: nextGraph },
            selectedNodeIds: nextSelectedNodeIds,
            nodeDragOriginGraph: null,
            ...buildExpressionSlicePatch(state, nextGraph),
          }))
          return
        }
        if (get().nodeDragOriginGraph) {
          set((state) => ({
            history: {
              past: [...state.history.past, cloneGraphState(dragOriginGraph)],
              present: cloneGraphState(nextGraph),
              future: [],
            },
            selectedNodeIds: nextSelectedNodeIds,
            nodeDragOriginGraph: null,
            ...buildExpressionSlicePatch(state, nextGraph),
          }))
          return
        }
      }

      set((state) => ({
        history: pushHistoryState(state.history, cloneGraphState(nextGraph)),
        selectedNodeIds: nextSelectedNodeIds,
        nodeDragOriginGraph: null,
        ...buildExpressionSlicePatch(state, nextGraph),
      }))
      return
    }

    set((state) => ({
      history: { ...state.history, present: nextGraph },
      selectedNodeIds: nextSelectedNodeIds,
      nodeDragOriginGraph:
        hasDraggingPositionChanges && !state.nodeDragOriginGraph
          ? cloneGraphState(currentGraph)
          : hasDraggingPositionChanges
            ? state.nodeDragOriginGraph
            : null,
      ...buildExpressionSlicePatch(state, nextGraph),
    }))
  },
  setViewport: (viewport) => {
    set((state) => {
      const currentViewport = state.history.present.viewport
      if (
        currentViewport.x === viewport.x &&
        currentViewport.y === viewport.y &&
        currentViewport.zoom === viewport.zoom
      ) {
        return state
      }
      return {
        history: {
          ...state.history,
          present: {
            ...state.history.present,
            viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
          },
        },
      }
    })
  },
})

function computeNextGraphFromNodeChanges(
  currentGraph: WorkflowGraphState,
  changes: NodeChange<WorkflowNode>[],
  selectedNodeIds: string[]
): {
  nextGraph: WorkflowGraphState
  removedNodeIds: Set<string>
  nodeCollectionChanged: boolean
  edgeCollectionChanged: boolean
  nextSelectedNodeIds: string[]
  selectionChanged: boolean
} {
  const rawNextNodes = applyNodeChanges(changes, currentGraph.nodes)
  const removedNodeIds = getRemovedNodeIds(changes)
  const nextEdges = filterEdgesForRemovedNodes(currentGraph.edges, removedNodeIds)
  const remainingNodeIds = new Set(rawNextNodes.map((node) => node.id))
  const nextSelectedNodeIds = selectedNodeIds.filter((id) => remainingNodeIds.has(id))
  const nextNodes = projectSelectionToNodes(rawNextNodes, nextSelectedNodeIds)
  return {
    nextGraph: { ...currentGraph, nodes: nextNodes, edges: nextEdges },
    removedNodeIds,
    nodeCollectionChanged: hasNodeCollectionChanged(currentGraph.nodes, nextNodes),
    edgeCollectionChanged: hasEdgeCollectionChanged(currentGraph.edges, nextEdges),
    nextSelectedNodeIds,
    selectionChanged: !haveSameIdSet(selectedNodeIds, nextSelectedNodeIds),
  }
}

function hasDraggingPositionChange(changes: NodeChange<WorkflowNode>[]): boolean {
  return changes.some((change) => change.type === "position" && change.dragging)
}

function isPositionOnlyChange(changes: NodeChange<WorkflowNode>[]): boolean {
  return changes.length > 0 && changes.every((change) => change.type === "position")
}

function haveNodePositionsChanged(currentNodes: WorkflowNode[], nextNodes: WorkflowNode[]): boolean {
  if (currentNodes.length !== nextNodes.length) return true
  const currentPositionsById = new Map(
    currentNodes.map((node) => [node.id, node.position] as const)
  )
  for (const node of nextNodes) {
    const currentPosition = currentPositionsById.get(node.id)
    if (!currentPosition) return true
    if (currentPosition.x !== node.position.x || currentPosition.y !== node.position.y) {
      return true
    }
  }
  return false
}
