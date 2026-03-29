import { hasOutgoingConnection } from "../helpers"
import type { WorkflowSliceCreator } from "../types"

export const createIntentSlice: WorkflowSliceCreator = (set, get) => ({
  lastPointerFlowPosition: null,
  quickAddPending: null,
  edgeInsertPending: null,
  lastError: null,
  setLastError: (message) => set({ lastError: message }),
  setLastPointerPosition: (position) => {
    set((state) => {
      const current = state.lastPointerFlowPosition
      if (current && current.x === position.x && current.y === position.y) {
        return state
      }
      return {
        lastPointerFlowPosition: {
          x: position.x,
          y: position.y,
        },
      }
    })
  },
  startQuickAddFromOutput: (sourceNodeId, sourceHandle = null) => {
    const currentGraph = get().history.present
    const sourceNode = currentGraph.nodes.find((node) => node.id === sourceNodeId)
    if (!sourceNode) return
    const normalizedHandle = sourceHandle ?? null
    if (
      hasOutgoingConnection(currentGraph.edges, sourceNodeId, normalizedHandle)
    ) {
      return
    }
    set({
      quickAddPending: { sourceNodeId, sourceHandle: normalizedHandle },
      edgeInsertPending: null,
    })
  },
  startEdgeInsertFromEdge: (edgeId) => {
    const currentGraph = get().history.present
    const edge = currentGraph.edges.find((candidate) => candidate.id === edgeId)
    if (!edge) return
    set({
      edgeInsertPending: { edgeId },
      quickAddPending: null,
    })
  },
  cancelQuickAdd: () => {
    if (!get().quickAddPending) return
    set({ quickAddPending: null })
  },
  cancelEdgeInsert: () => {
    if (!get().edgeInsertPending) return
    set({ edgeInsertPending: null })
  },
})
