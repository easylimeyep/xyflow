import { type HistoryState, redoHistoryState, undoHistoryState } from "@workspace/store"

import type { WorkflowGraphState } from "../../types/types"
import { buildExpressionSlicePatch } from "../expression-deps"
import { projectSelectionToNodes } from "../selection-sync"
import type { WorkflowSliceCreator, WorkflowStoreState } from "../types"

function applyHistoryNavigation(
  state: WorkflowStoreState,
  historyFn: (h: HistoryState<WorkflowGraphState>) => HistoryState<WorkflowGraphState>
): Partial<WorkflowStoreState> {
  const nextHistory = historyFn(state.history)
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
}

export const createHistorySlice: WorkflowSliceCreator = (set) => ({
  undo: () => {
    set((state) => applyHistoryNavigation(state, undoHistoryState))
  },
  redo: () => {
    set((state) => applyHistoryNavigation(state, redoHistoryState))
  },
})
