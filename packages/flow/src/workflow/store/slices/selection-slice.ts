import { haveSameIdSet, normalizeSelectionIds } from "../helpers"
import { projectSelectionToNodes } from "../selection-sync"
import type { WorkflowSliceCreator } from "../types"

export const createSelectionSlice: WorkflowSliceCreator = (set) => ({
  selectedNodeIds: [],
  nodeDragOriginGraph: null,
  setSelectedNodes: (nodeIds) => {
    const normalizedNodeIds = normalizeSelectionIds(nodeIds)
    set((state) => {
      const nextNodes = projectSelectionToNodes(
        state.history.present.nodes,
        normalizedNodeIds
      )
      const nodesChanged = nextNodes !== state.history.present.nodes
      if (!nodesChanged && haveSameIdSet(state.selectedNodeIds, normalizedNodeIds)) {
        return state
      }
      if (!nodesChanged) {
        return { selectedNodeIds: normalizedNodeIds }
      }
      return {
        selectedNodeIds: normalizedNodeIds,
        history: {
          ...state.history,
          present: {
            ...state.history.present,
            nodes: nextNodes,
          },
        },
      }
    })
  },
  setSelectedNode: (nodeId) => {
    const nextSelectedNodeIds = nodeId ? [nodeId] : []
    set((state) => {
      const nextNodes = projectSelectionToNodes(
        state.history.present.nodes,
        nextSelectedNodeIds
      )
      const nodesChanged = nextNodes !== state.history.present.nodes
      if (haveSameIdSet(state.selectedNodeIds, nextSelectedNodeIds)) {
        return nodesChanged
          ? {
              history: {
                ...state.history,
                present: {
                  ...state.history.present,
                  nodes: nextNodes,
                },
              },
            }
          : state
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
    })
  },
})
