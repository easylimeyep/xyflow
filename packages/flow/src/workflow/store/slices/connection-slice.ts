import { addEdge, applyEdgeChanges } from "@xyflow/react"

import { createWorkflowError } from "../../types/errors"
import type { WorkflowEdge } from "../../types/types"
import { getKindsFromConnection, validateConnection, type ConnectionLike } from "../../validation/validation"
import { hasEdgeCollectionChanged, shouldCommitEdgeHistory } from "../collection-diff"
import { toEdgeConnectionWithKind } from "../dto-mappers"
import { commitGraphState, replacePresentGraphState } from "../history-helpers"
import type { WorkflowSliceCreator } from "../types"

export const createConnectionSlice: WorkflowSliceCreator = (set, get) => ({
  onEdgesChange: (changes) => {
    const currentGraph = get().history.present
    const nextEdges = applyEdgeChanges(changes, currentGraph.edges)
    if (!hasEdgeCollectionChanged(currentGraph.edges, nextEdges)) return
    const nextGraph = { ...currentGraph, edges: nextEdges }
    if (shouldCommitEdgeHistory(changes)) {
      commitGraphState(set, nextGraph)
      return
    }
    replacePresentGraphState(set, nextGraph)
  },
  onConnect: (connection) => {
    const currentGraph = get().history.present
    const validation = validateConnection(connection, currentGraph.nodes, currentGraph.edges)
    if (!validation.valid) {
      set({ lastError: createWorkflowError("INVALID_CONNECTION", validation.reason ?? "Invalid connection.") })
      return
    }
    const kinds = getKindsFromConnection(connection, currentGraph.nodes)
    if (!kinds) {
      set({ lastError: createWorkflowError("KIND_RESOLUTION_FAILED", "Failed to resolve node kinds for connection.") })
      return
    }
    const nextEdges = addEdge(
      toEdgeConnectionWithKind(connection, kinds.sourceKind, kinds.targetKind),
      currentGraph.edges
    ) as WorkflowEdge[]
    commitGraphState(set, { ...currentGraph, edges: nextEdges })
    set({ lastError: null })
  },
})
