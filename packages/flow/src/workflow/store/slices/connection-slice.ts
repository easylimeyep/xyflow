import { applyEdgeChanges } from "@xyflow/react"

import { applyConnectNodesCommand } from "../../graph-engine"
import type { WorkflowEdge } from "../../types/types"
import { hasEdgeCollectionChanged, shouldCommitEdgeHistory } from "../collection-diff"
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
    const result = applyConnectNodesCommand(currentGraph, { connection })
    if (!result.ok) {
      set({ lastError: result.error })
      return
    }
    commitGraphState(set, result.nextGraph)
    set({ lastError: null })
  },
})
