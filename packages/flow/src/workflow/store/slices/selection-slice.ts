import { haveSameIdSet, normalizeSelectionIds } from "../helpers"
import { projectSelectionToNodes } from "../selection-sync"
import type { WorkflowSliceCreator, WorkflowStoreState } from "../types"

function applySelection(
  state: WorkflowStoreState,
  nextSelectedNodeIds: string[]
): Partial<WorkflowStoreState> | WorkflowStoreState {
  const nextNodes = projectSelectionToNodes(
    state.graph.nodes,
    nextSelectedNodeIds
  )
  const nodesChanged = nextNodes !== state.graph.nodes
  if (
    !nodesChanged &&
    haveSameIdSet(state.selectedNodeIds, nextSelectedNodeIds)
  ) {
    return state
  }
  if (!nodesChanged) {
    return { selectedNodeIds: nextSelectedNodeIds }
  }
  return {
    selectedNodeIds: nextSelectedNodeIds,
    graph: {
      ...state.graph,
      nodes: nextNodes,
    },
  }
}

export const createSelectionSlice: WorkflowSliceCreator = (set, _get, api) => ({
  selectedNodeIds: [],
  nodeDragOriginGraph: null,
  setSelectedNodes: (nodeIds) => {
    const normalizedNodeIds = normalizeSelectionIds(nodeIds)
    // Selecting is not an undo step, but it does flip `selected` on the
    // graph's own nodes — which is inside the history slice.
    api.history.getState().skip(() => {
      set((state) => applySelection(state, normalizedNodeIds))
    })
  },
  setSelectedNode: (nodeId) => {
    const nextSelectedNodeIds = nodeId ? [nodeId] : []
    set((state) => applySelection(state, nextSelectedNodeIds))
  },
})
