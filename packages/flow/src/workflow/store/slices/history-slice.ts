import { redoHistoryState, undoHistoryState } from "@workspace/store"

import { buildExpressionSlicePatch } from "../expression-deps"
import { projectSelectionToNodes } from "../selection-sync"
import type { WorkflowSliceCreator } from "../types"

export const createHistorySlice: WorkflowSliceCreator = (set) => ({
  undo: () => {
    set((state) => {
      const nextHistory = undoHistoryState(state.history)
      const nextPresentNodes = projectSelectionToNodes(
        nextHistory.present.nodes,
        state.selectedNodeIds
      )
      const historyWithSelection =
        nextPresentNodes === nextHistory.present.nodes
          ? nextHistory
          : {
              ...nextHistory,
              present: {
                ...nextHistory.present,
                nodes: nextPresentNodes,
              },
            }
      return {
        history: historyWithSelection,
        nodeDragOriginGraph: null,
        lastError: null,
        ...buildExpressionSlicePatch(state, historyWithSelection.present),
      }
    })
  },
  redo: () => {
    set((state) => {
      const nextHistory = redoHistoryState(state.history)
      const nextPresentNodes = projectSelectionToNodes(
        nextHistory.present.nodes,
        state.selectedNodeIds
      )
      const historyWithSelection =
        nextPresentNodes === nextHistory.present.nodes
          ? nextHistory
          : {
              ...nextHistory,
              present: {
                ...nextHistory.present,
                nodes: nextPresentNodes,
              },
            }
      return {
        history: historyWithSelection,
        nodeDragOriginGraph: null,
        lastError: null,
        ...buildExpressionSlicePatch(state, historyWithSelection.present),
      }
    })
  },
})
