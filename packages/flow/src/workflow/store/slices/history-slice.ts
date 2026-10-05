import { projectSelectionToNodes } from "../selection-sync"
import { buildExpressionSlicePatch } from "../expression-deps"
import type { WorkflowSliceCreator, WorkflowStoreApi } from "../types"
import type { WorkflowStoreSetState } from "../types"

/**
 * Re-derives everything undo/redo left untouched.
 *
 * `withHistory` restores the graph and nothing else, by design — the selection
 * and the pending intents are deliberately outside the history slice. But two
 * things do have to follow the graph back: the per-node `selected` flags, which
 * live on the restored nodes and would otherwise carry the selection the graph
 * had when it was recorded, and the expression caches derived from it.
 *
 * The write runs under `skip` because it touches `graph`, and a recorded write
 * here would push the navigation itself onto the undo stack.
 */
function syncAfterHistoryNavigation(
  api: WorkflowStoreApi,
  set: WorkflowStoreSetState
): void {
  api.history.getState().skip(() => {
    set((state) => {
      const nextNodes = projectSelectionToNodes(
        state.graph.nodes,
        state.selectedNodeIds
      )
      const nextGraph =
        nextNodes === state.graph.nodes
          ? state.graph
          : { ...state.graph, nodes: nextNodes }

      // A group the navigation removed cannot stay selected.
      const groupIds = new Set(nextGraph.groups.map((group) => group.id))
      const selectedGroupIds = state.selectedGroupIds.filter((id) =>
        groupIds.has(id)
      )

      return {
        graph: nextGraph,
        selectedGroupIds:
          selectedGroupIds.length === state.selectedGroupIds.length
            ? state.selectedGroupIds
            : selectedGroupIds,
        nodeDragOriginGraph: null,
        lastError: null,
        ...buildExpressionSlicePatch(state, nextGraph),
      }
    })
  })
}

export const createHistorySlice: WorkflowSliceCreator = (set, _get, api) => ({
  undo: () => {
    api.history.getState().undo()
    syncAfterHistoryNavigation(api, set)
  },
  redo: () => {
    api.history.getState().redo()
    syncAfterHistoryNavigation(api, set)
  },
})
