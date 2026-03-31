import { haveSameIdSet, normalizeSelectionIds } from "../helpers"
import type { WorkflowSliceCreator } from "../types"

export const createSelectionSlice: WorkflowSliceCreator = (set) => ({
  selectedNodeIds: [],
  setSelectedNodes: (nodeIds) => {
    const normalizedNodeIds = normalizeSelectionIds(nodeIds)
    set((state) => {
      const selectedNodeIdSet = new Set(normalizedNodeIds)
      const nextNodes = state.history.present.nodes.map((node) => {
        const shouldBeSelected = selectedNodeIdSet.has(node.id)
        if (Boolean(node.selected) === shouldBeSelected) {
          return node
        }
        return {
          ...node,
          selected: shouldBeSelected,
        }
      })
      const nodesChanged = nextNodes.some(
        (node, index) => node !== state.history.present.nodes[index]
      )
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
      const selectedNodeIdSet = new Set(nextSelectedNodeIds)
      const nextNodes = state.history.present.nodes.map((node) => {
        const shouldBeSelected = selectedNodeIdSet.has(node.id)
        if (Boolean(node.selected) === shouldBeSelected) {
          return node
        }
        return {
          ...node,
          selected: shouldBeSelected,
        }
      })
      const nodesChanged = nextNodes.some(
        (node, index) => node !== state.history.present.nodes[index]
      )
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
