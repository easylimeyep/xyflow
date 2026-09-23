import { cloneDeep } from "es-toolkit/object"

import type { WorkflowGraphState } from "../types/types"
import { buildExpressionSlicePatch } from "./expression-deps"
import { projectSelectionToNodes } from "./selection-sync"

import type { WorkflowStoreApi, WorkflowStoreSetState } from "./types"

/**
 * Deep-copies a graph coming from outside the store (host-provided initial
 * graph, imported JSON) so later edits cannot reach back into the caller's
 * object. Graphs produced inside the store are already treated as immutable
 * and are stored by reference, which keeps node identity stable across history
 * commits and avoids re-rendering every node on the canvas.
 */
export function cloneGraphState(graph: WorkflowGraphState): WorkflowGraphState {
  return cloneDeep(graph)
}

/**
 * Writes `nextGraph` as a new undoable step.
 *
 * `withHistory` records this on its own: the write changes `graph`, which is
 * the whole history slice, so the middleware pushes the previous graph onto
 * `pasts` and drops the redo stack. The derived fields updated alongside it sit
 * outside that slice and are therefore never recorded.
 */
export function commitGraphState(
  set: WorkflowStoreSetState,
  nextGraph: WorkflowGraphState
): void {
  set((state) => ({
    graph: nextGraph,
    nodeDragOriginGraph: null,
    ...buildExpressionSlicePatch(state, nextGraph),
  }))
}

/**
 * Writes `nextGraph` WITHOUT adding a history step — the transient updates a
 * drag or an in-flight connection produces, which must not each become their
 * own undo.
 *
 * `skip` suppresses recording for the duration of the write, leaving both
 * stacks exactly as they were.
 */
export function replacePresentGraphState(
  api: WorkflowStoreApi,
  set: WorkflowStoreSetState,
  nextGraph: WorkflowGraphState
): void {
  api.history.getState().skip(() => {
    set((state) => ({
      graph: nextGraph,
      nodeDragOriginGraph: null,
      ...buildExpressionSlicePatch(state, nextGraph),
    }))
  })
}

/**
 * Marks `nodeIds` as the selection on the graph's own nodes, without opening a
 * history step.
 *
 * Callers reach for this straight after `commitGraphState`, to select whatever
 * they just created. That is one user action and must stay one undo, so this
 * follow-up write — which touches `graph`, and would otherwise be recorded as a
 * step of its own — runs under `skip`.
 */
export function projectSelectionWithoutHistory(
  api: WorkflowStoreApi,
  set: WorkflowStoreSetState,
  nodeIds: string[]
): void {
  api.history.getState().skip(() => {
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: projectSelectionToNodes(state.graph.nodes, nodeIds),
      },
    }))
  })
}
