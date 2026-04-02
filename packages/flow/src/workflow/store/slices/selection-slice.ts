import { haveSameIdSet, normalizeSelectionIds } from "../helpers"
import { projectSelectionToNodes } from "../selection-sync"
import type { WorkflowSliceCreator, WorkflowStoreState } from "../types"

function applySelection(
  state: WorkflowStoreState,
  nextSelectedNodeIds: string[]
): Partial<WorkflowStoreState> | WorkflowStoreState {
  const nextNodes = projectSelectionToNodes(
    state.history.present.nodes,
    nextSelectedNodeIds
  )
  const nodesChanged = nextNodes !== state.history.present.nodes
  if (!nodesChanged && haveSameIdSet(state.selectedNodeIds, nextSelectedNodeIds)) {
    return state
  }
  if (!nodesChanged) {
    return { selectedNodeIds: nextSelectedNodeIds }
  }
  return {
    selectedNodeIds: nextSelectedNodeIds,
    history: {
      ...state.history,
      present: {
        ...state.history.present,
        nodes: nextNodes,
      },
    },
  }
}

export const createSelectionSlice: WorkflowSliceCreator = (set) => ({
  selectedNodeIds: [],
  nodeDragOriginGraph: null,
  setSelectedNodes: (nodeIds) => {
    const normalizedNodeIds = normalizeSelectionIds(nodeIds)
    set((state) => applySelection(state, normalizedNodeIds))
  },
  setSelectedNode: (nodeId) => {
    const nextSelectedNodeIds = nodeId ? [nodeId] : []
    set((state) => applySelection(state, nextSelectedNodeIds))
  },
})
