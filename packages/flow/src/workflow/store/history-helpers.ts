import { cloneDeep } from "es-toolkit/object"

import {
  createHistoryState,
  pushHistoryState,
  type HistoryState,
} from "@flow/store"

import type { WorkflowGraphState } from "../types/types"
import { buildExpressionSlicePatch } from "./expression-deps"

import type { WorkflowStoreSetState } from "./types"

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

export function createInitialHistory(
  graph: WorkflowGraphState
): HistoryState<WorkflowGraphState> {
  return createHistoryState(cloneGraphState(graph))
}

export function commitGraphState(
  set: WorkflowStoreSetState,
  nextGraph: WorkflowGraphState
): void {
  set((state) => ({
    history: pushHistoryState(state.history, nextGraph),
    nodeDragOriginGraph: null,
    ...buildExpressionSlicePatch(state, nextGraph),
  }))
}

export function replacePresentGraphState(
  set: WorkflowStoreSetState,
  nextGraph: WorkflowGraphState
): void {
  set((state) => ({
    history: {
      ...state.history,
      present: nextGraph,
    },
    nodeDragOriginGraph: null,
    ...buildExpressionSlicePatch(state, nextGraph),
  }))
}
