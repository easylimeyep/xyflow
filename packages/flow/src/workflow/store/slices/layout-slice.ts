import { createWorkflowError } from "../../types/errors"
import { computeWorkflowAutoLayout } from "../../layout"
import { buildExpressionSlicePatch } from "../expression-deps"
import { cloneGraphState, commitGraphState } from "../history-helpers"
import type { WorkflowSliceCreator } from "../types"

export const createLayoutSlice: WorkflowSliceCreator = (set, get) => ({
  autoLayout: async () => {
    const currentGraph = get().history.present

    try {
      const nextGraph = await computeWorkflowAutoLayout(currentGraph)

      if (nextGraph.nodes === currentGraph.nodes) {
        set({ lastError: null })
        return true
      }

      commitGraphState(set, nextGraph)
      set({ lastError: null })
      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to auto-layout workflow graph."
      set({
        lastError: createWorkflowError("AUTO_LAYOUT_FAILED", message),
      })
      return false
    }
  },
  measuredInitialAutoLayout: async () => {
    if (get().measuredInitialAutoLayoutAttempted) {
      return true
    }

    const currentGraph = get().history.present
    set({ measuredInitialAutoLayoutAttempted: true })

    try {
      const nextGraph = await computeWorkflowAutoLayout(currentGraph)

      set((state) => ({
        history: {
          past: state.history.past,
          present: cloneGraphState(nextGraph),
          future: [],
        },
        nodeDragOriginGraph: null,
        lastError: null,
        ...buildExpressionSlicePatch(state, nextGraph),
      }))
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to auto-layout workflow graph."
      set({
        lastError: createWorkflowError("AUTO_LAYOUT_FAILED", message),
      })
      return false
    }
  },
})
