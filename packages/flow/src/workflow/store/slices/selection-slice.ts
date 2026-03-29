import { haveSameIdSet, normalizeSelectionIds } from "../helpers"
import type { WorkflowSliceCreator } from "../types"

export const createSelectionSlice: WorkflowSliceCreator = (set) => ({
  selectedNodeIds: [],
  setSelectedNodes: (nodeIds) => {
    const normalizedNodeIds = normalizeSelectionIds(nodeIds)
    set((state) => {
      if (haveSameIdSet(state.selectedNodeIds, normalizedNodeIds)) {
        return state
      }
      return { selectedNodeIds: normalizedNodeIds }
    })
  },
  setSelectedNode: (nodeId) => {
    set((state) => {
      const nextSelectedNodeIds = nodeId ? [nodeId] : []
      if (haveSameIdSet(state.selectedNodeIds, nextSelectedNodeIds)) {
        return state
      }
      return { selectedNodeIds: nextSelectedNodeIds }
    })
  },
})
