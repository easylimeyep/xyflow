import { cloneDeep } from "es-toolkit/object"

import {
  createHistoryState,
  pushHistoryState,
  type HistoryState,
} from "@workspace/store"

import type { WorkflowGraphState } from "../types/types"

import type { WorkflowStoreSetState } from "./types"

export function cloneGraphState(graph: WorkflowGraphState): WorkflowGraphState {
  return cloneDeep(graph)
}

export function createInitialHistory(graph: WorkflowGraphState): HistoryState<WorkflowGraphState> {
  return createHistoryState(cloneGraphState(graph))
}

export function commitGraphState(
  set: WorkflowStoreSetState,
  nextGraph: WorkflowGraphState
): void {
  set((state) => ({
    history: pushHistoryState(state.history, cloneGraphState(nextGraph)),
  }))
}

export function replacePresentGraphState(
  set: WorkflowStoreSetState,
  nextGraph: WorkflowGraphState
): void {
  set((state) => ({
    history: {
      ...state.history,
      present: cloneGraphState(nextGraph),
    },
  }))
}
