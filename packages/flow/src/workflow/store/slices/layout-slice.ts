import { createWorkflowError } from "../../types/errors"
import { computeWorkflowAutoLayout } from "../../layout"
import { commitGraphState } from "../history-helpers"
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
      const message = error instanceof Error ? error.message : "Failed to auto-layout workflow graph."
      set({
        lastError: createWorkflowError("AUTO_LAYOUT_FAILED", message),
      })
      return false
    }
  },
})
