import { redoHistoryState, undoHistoryState } from "@workspace/store"

import { buildExpressionSlicePatch } from "../expression-deps"
import type { WorkflowSliceCreator } from "../types"

export const createHistorySlice: WorkflowSliceCreator = (set) => ({
  undo: () => {
    set((state) => {
      const nextHistory = undoHistoryState(state.history)
      return {
        history: nextHistory,
        lastError: null,
        ...buildExpressionSlicePatch(state, nextHistory.present),
      }
    })
  },
  redo: () => {
    set((state) => {
      const nextHistory = redoHistoryState(state.history)
      return {
        history: nextHistory,
        lastError: null,
        ...buildExpressionSlicePatch(state, nextHistory.present),
      }
    })
  },
})
