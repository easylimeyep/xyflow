import type { NodeChange } from "@xyflow/react"
import { pushHistoryState } from "@workspace/store"

import {
  applyConnectNodesCommand,
  applyInsertNodeOnEdgeCommand,
  applyNodeChangesCommand,
  createNodeWithUniqueLabel,
} from "../../graph-engine"
import { createWorkflowError } from "../../types/errors"
import type { WorkflowNode } from "../../types/types"
import type { ConnectionLike } from "../../validation/validation"
import {
  hasOutgoingConnection,
  shouldCommitNodeHistory,
  shouldSquashPreviousEdgeRemovalWithNodeRemoval,
} from "../collection-diff"
import { buildExpressionSlicePatch } from "../expression-deps"
import { createSmartQuickAddPosition } from "../geometry"
import { cloneGraphState, commitGraphState } from "../history-helpers"
import { projectSelectionToNodes } from "../selection-sync"
import type { WorkflowSliceCreator } from "../types"

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
    const connection: ConnectionLike = {
      source: pending.sourceNodeId,
      target: "",
      sourceHandle: pending.sourceHandle,
      targetHandle: null,
    }
    const nextNode = createNodeWithUniqueLabel(currentGraph.nodes, kind, nextNodePosition)
    connection.target = nextNode.id
    const connectResult = applyConnectNodesCommand(
      { ...currentGraph, nodes: [...currentGraph.nodes, nextNode] },
      { connection }
    )
    if (!connectResult.ok) {
      set({ lastError: connectResult.error })
      return
    }

    commitGraphState(set, connectResult.nextGraph)
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

    const result = applyInsertNodeOnEdgeCommand(currentGraph, {
      edgeId: pending.edgeId,
      kind,
    })
    if (!result.ok) {
      set({ edgeInsertPending: null, lastError: result.error })
      return
    }

    const insertedNodeId = result.nextGraph.nodes.at(-1)?.id
    if (!insertedNodeId) {
      set({
        edgeInsertPending: null,
        lastError: createWorkflowError(
          "EDGE_INSERT_FAILED",
          "Inserted node could not be resolved after edge insertion."
        ),
      })
      return
    }

    commitGraphState(set, result.nextGraph)
    set((state) => ({
      edgeInsertPending: null,
      selectedNodeIds: [insertedNodeId],
      history: {
        ...state.history,
        present: {
          ...state.history.present,
          nodes: projectSelectionToNodes(state.history.present.nodes, [insertedNodeId]),
        },
      },
      lastError: null,
    }))
  },
  onNodesChange: (changes) => {
    const history = get().history
    const currentGraph = history.present
    const computed = applyNodeChangesCommand(currentGraph, {
      changes,
      selectedNodeIds: get().selectedNodeIds,
    })
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
