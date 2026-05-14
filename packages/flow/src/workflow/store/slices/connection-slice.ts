import { applyEdgeChanges, type EdgeChange } from "@xyflow/react"

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
    const touchedNodeIds = getTouchedNodeIdsForEdgeChanges(
      changes,
      currentGraph.edges,
      nextEdges
    )
    const nextGraph = { ...currentGraph, edges: nextEdges }
    if (shouldCommitEdgeHistory(changes)) {
      commitGraphState(set, nextGraph)
      get().hideValidationForNodes(touchedNodeIds)
      get().hideGlobalValidation()
      return
    }
    replacePresentGraphState(set, nextGraph)
    get().hideValidationForNodes(touchedNodeIds)
    get().hideGlobalValidation()
  },
  onConnect: (connection) => {
    const currentGraph = get().history.present
    const result = applyConnectNodesCommand(currentGraph, { connection })
    if (!result.ok) {
      set({ lastError: result.error })
      return
    }
    commitGraphState(set, result.nextGraph)
    get().hideValidationForNodes(
      [connection.source, connection.target].filter(Boolean) as string[]
    )
    get().hideGlobalValidation()
    set({ lastError: null })
  },
})

function getTouchedNodeIdsForEdgeChanges(
  changes: EdgeChange<WorkflowEdge>[],
  currentEdges: WorkflowEdge[],
  nextEdges: WorkflowEdge[]
): string[] {
  const touchedNodeIds = new Set<string>()
  const currentEdgesById = new Map(currentEdges.map((edge) => [edge.id, edge]))
  const nextEdgesById = new Map(nextEdges.map((edge) => [edge.id, edge]))

  changes.forEach((change) => {
    if (!("id" in change)) {
      if ("item" in change) {
        touchedNodeIds.add(change.item.source)
        touchedNodeIds.add(change.item.target)
      }
      return
    }

    const edge =
      currentEdgesById.get(change.id) ?? nextEdgesById.get(change.id)
    if (!edge) return

    touchedNodeIds.add(edge.source)
    touchedNodeIds.add(edge.target)
  })

  return Array.from(touchedNodeIds)
}
