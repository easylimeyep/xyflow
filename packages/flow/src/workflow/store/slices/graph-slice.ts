import type { NodeChange } from "@xyflow/react"

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
  isOutputSaturated,
  shouldCommitNodeHistory,
  shouldSquashPreviousEdgeRemovalWithNodeRemoval,
} from "../collection-diff"
import { buildExpressionSlicePatch } from "../expression-deps"
import { createSmartQuickAddPosition } from "../geometry"
import {
  commitGraphState,
  projectSelectionWithoutHistory,
} from "../history-helpers"
import type { WorkflowSliceCreator, WorkflowStoreState } from "../types"

export const createGraphSlice: WorkflowSliceCreator = (set, get, api) => ({
  confirmQuickAddNode: (kind) => {
    const currentGraph = get().graph
    const pending = get().quickAddPending
    if (!pending) return

    const sourceNode = currentGraph.nodes.find(
      (node) => node.id === pending.sourceNodeId
    )
    if (!sourceNode) {
      set({
        quickAddPending: null,
        lastError: createWorkflowError(
          "NODE_NOT_FOUND",
          "Failed to resolve source node for quick add."
        ),
      })
      return
    }

    if (
      isOutputSaturated(
        get().registry,
        currentGraph.edges,
        sourceNode.id,
        pending.sourceHandle,
        () => sourceNode.data.kind
      )
    ) {
      set({
        quickAddPending: null,
        lastError: createWorkflowError(
          "OUTGOING_CONNECTION_EXISTS",
          "Selected output already has an outgoing connection."
        ),
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
    const nextNode = createNodeWithUniqueLabel(
      get().registry,
      currentGraph.nodes,
      kind,
      nextNodePosition
    )
    connection.target = nextNode.id
    const connectResult = applyConnectNodesCommand(
      get().registry,
      { ...currentGraph, nodes: [...currentGraph.nodes, nextNode] },
      { connection }
    )
    if (!connectResult.ok) {
      set({ lastError: connectResult.error })
      return
    }

    commitGraphState(set, connectResult.nextGraph)
    projectSelectionWithoutHistory(api, set, [nextNode.id])
    set((state) => ({
      quickAddPending: null,
      selectedNodeIds: [nextNode.id],
      lastError: null,
      ...hideValidationForStructuralNodeChange(
        state,
        [pending.sourceNodeId, nextNode.id],
        true
      ),
    }))
  },
  confirmEdgeInsertNode: (kind) => {
    const currentGraph = get().graph
    const pending = get().edgeInsertPending
    if (!pending) return

    const result = applyInsertNodeOnEdgeCommand(get().registry, currentGraph, {
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
    projectSelectionWithoutHistory(api, set, [insertedNodeId])
    set((state) => ({
      edgeInsertPending: null,
      selectedNodeIds: [insertedNodeId],
      lastError: null,
      ...hideValidationForStructuralNodeChange(state, [insertedNodeId], true),
    }))
  },
  onNodesChange: (changes) => {
    const currentGraph = get().graph
    const computed = applyNodeChangesCommand(currentGraph, {
      changes,
      selectedNodeIds: get().selectedNodeIds,
    })
    const {
      nextGraph,
      removedNodeIds,
      nodeCollectionChanged,
      edgeCollectionChanged,
      selectionChanged,
      nextSelectedNodeIds,
    } = computed
    const shouldHideGlobalValidation =
      hasStructuralNodeCollectionChange(changes) || edgeCollectionChanged
    const hasDraggingPositionChanges = hasDraggingPositionChange(changes)
    const shouldCommitSemanticHistory = shouldCommitNodeHistory(changes)
    const positionOnlyChange = isPositionOnlyChange(changes)
    const expressionPatchFor = (state: ReturnType<typeof get>) =>
      positionOnlyChange ? {} : buildExpressionSlicePatch(state, nextGraph)

    if (!nodeCollectionChanged && !edgeCollectionChanged && !selectionChanged) {
      if (!hasDraggingPositionChanges && get().nodeDragOriginGraph) {
        set({ nodeDragOriginGraph: null })
      }
      return
    }

    if (shouldCommitSemanticHistory) {
      if (
        shouldSquashPreviousEdgeRemovalWithNodeRemoval(
          api.history.getState().pasts.at(-1)?.graph,
          currentGraph,
          removedNodeIds
        )
      ) {
        // Folds into the undo step the preceding edge removal already opened,
        // so this write must not open one of its own. It is still a user edit
        // though, so the redo branch it lands on top of no longer applies —
        // cleared before the write, never after, so nothing observes the new
        // graph beside a redo step that would resurrect the removed node.
        api.history.getState().clearFutures()
        api.history.getState().skip(() => {
          set((state) => ({
            graph: nextGraph,
            selectedNodeIds: nextSelectedNodeIds,
            nodeDragOriginGraph: null,
            ...expressionPatchFor(state),
            ...hideValidationForStructuralNodeChange(
              state,
              removedNodeIds,
              shouldHideGlobalValidation
            ),
          }))
        })
        return
      }

      if (positionOnlyChange) {
        const dragOriginGraph = get().nodeDragOriginGraph ?? currentGraph
        if (!haveNodePositionsChanged(dragOriginGraph.nodes, nextGraph.nodes)) {
          // The drag put every node back where it started — nothing to undo.
          api.history.getState().skip(() => {
            set((state) => ({
              graph: nextGraph,
              selectedNodeIds: nextSelectedNodeIds,
              nodeDragOriginGraph: null,
              ...expressionPatchFor(state),
              ...hideValidationForStructuralNodeChange(
                state,
                removedNodeIds,
                shouldHideGlobalValidation
              ),
            }))
          })
          return
        }
        if (get().nodeDragOriginGraph) {
          // A drag is one undo step, from where the nodes were picked up to
          // where they were dropped — not one per intermediate position. The
          // moves in between were written with recording suppressed, so the
          // graph currently holds the last of them, not the origin.
          //
          // Putting the origin back under `skip` and then committing the final
          // graph normally makes the recorded step span the whole drag. Both
          // writes land in the same event handler, so React renders once, at
          // the final position.
          api.history.getState().skip(() => {
            set({ graph: dragOriginGraph })
          })
          set((state) => ({
            graph: nextGraph,
            selectedNodeIds: nextSelectedNodeIds,
            nodeDragOriginGraph: null,
            ...expressionPatchFor(state),
            ...hideValidationForStructuralNodeChange(
              state,
              removedNodeIds,
              shouldHideGlobalValidation
            ),
          }))
          return
        }
      }

      set((state) => ({
        graph: nextGraph,
        selectedNodeIds: nextSelectedNodeIds,
        nodeDragOriginGraph: null,
        ...expressionPatchFor(state),
        ...hideValidationForStructuralNodeChange(
          state,
          removedNodeIds,
          shouldHideGlobalValidation
        ),
      }))
      return
    }

    // Transient: a selection flip or a mid-drag position, neither of which is
    // an undo step of its own.
    api.history.getState().skip(() => {
      set((state) => ({
        graph: nextGraph,
        selectedNodeIds: nextSelectedNodeIds,
        nodeDragOriginGraph:
          hasDraggingPositionChanges && !state.nodeDragOriginGraph
            ? currentGraph
            : hasDraggingPositionChanges
              ? state.nodeDragOriginGraph
              : null,
        ...expressionPatchFor(state),
        ...hideValidationForStructuralNodeChange(
          state,
          removedNodeIds,
          shouldHideGlobalValidation
        ),
      }))
    })
  },
  setViewport: (viewport) => {
    // The viewport rides along inside `graph`, so it is inside the history
    // slice — but panning and zooming are not edits and must not be undoable.
    api.history.getState().skip(() => {
      set((state) => {
        const currentViewport = state.graph.viewport
        if (
          currentViewport.x === viewport.x &&
          currentViewport.y === viewport.y &&
          currentViewport.zoom === viewport.zoom
        ) {
          return state
        }
        return {
          graph: {
            ...state.graph,
            viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
          },
        }
      })
    })
  },
})

function hasDraggingPositionChange(
  changes: NodeChange<WorkflowNode>[]
): boolean {
  return changes.some((change) => change.type === "position" && change.dragging)
}

function isPositionOnlyChange(changes: NodeChange<WorkflowNode>[]): boolean {
  return (
    changes.length > 0 && changes.every((change) => change.type === "position")
  )
}

function hasStructuralNodeCollectionChange(
  changes: NodeChange<WorkflowNode>[]
): boolean {
  return changes.some(
    (change) => change.type === "add" || change.type === "remove"
  )
}

function haveNodePositionsChanged(
  currentNodes: WorkflowNode[],
  nextNodes: WorkflowNode[]
): boolean {
  if (currentNodes.length !== nextNodes.length) return true
  const currentPositionsById = new Map(
    currentNodes.map((node) => [node.id, node.position] as const)
  )
  for (const node of nextNodes) {
    const currentPosition = currentPositionsById.get(node.id)
    if (!currentPosition) return true
    if (
      currentPosition.x !== node.position.x ||
      currentPosition.y !== node.position.y
    ) {
      return true
    }
  }
  return false
}

function hideValidationForStructuralNodeChange(
  state: WorkflowStoreState,
  removedNodeIds: Iterable<string>,
  hideGlobal: boolean
) {
  const { validation } = state
  if (!validation?.server) {
    return {}
  }

  const locallyHiddenKeys = new Set(validation.locallyHiddenKeys)
  const server = validation.server

  if (hideGlobal) {
    server.global.forEach((message) => locallyHiddenKeys.add(message.key))
  }

  for (const nodeId of removedNodeIds) {
    server.nodesById[nodeId]?.forEach((message) =>
      locallyHiddenKeys.add(message.key)
    )
  }

  if (locallyHiddenKeys.size === validation.locallyHiddenKeys.size) {
    return {}
  }

  return {
    validation: {
      ...validation,
      locallyHiddenKeys,
    },
  }
}
