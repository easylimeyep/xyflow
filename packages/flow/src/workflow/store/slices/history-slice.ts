import { redoHistoryState, undoHistoryState } from "@workspace/store"

import type { WorkflowSliceCreator } from "../types"

export const createHistorySlice: WorkflowSliceCreator = (set) => ({
  undo: () => {
    set((state) => ({
      history: undoHistoryState(state.history),
      lastError: null,
    }))
  },
  redo: () => {
    set((state) => ({
      history: redoHistoryState(state.history),
      lastError: null,
    }))
  },
})
