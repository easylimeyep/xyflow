import { createContextStore, createStore, createHistoryState, type StoreApi } from "@workspace/store"

import { initialWorkflowGraph } from "../default-graph/default-graph"
import type { WorkflowGraphState } from "../types/types"
import { cloneGraphState } from "./helpers"
import {
  createGraphSlice,
  createHistorySlice,
  createIntentSlice,
  createIoSlice,
  createSelectionSlice,
} from "./slices"
import type { WorkflowStoreInitialProps, WorkflowStoreState } from "./types"

export type {
  PendingEdgeInsert,
  PendingQuickAdd,
  WorkflowStoreInitialProps,
  WorkflowStoreState,
} from "./types"

export function createWorkflowStore(
  initialProps: WorkflowStoreInitialProps = {}
): StoreApi<WorkflowStoreState> {
  const initialGraph = cloneGraphState(
    initialProps.initialGraph ?? initialWorkflowGraph
  )

  return createStore<WorkflowStoreState>()((set, get) => {
    const nextState = {
    history: createHistoryState(initialGraph),
    ...createSelectionSlice(set, get),
    ...createIntentSlice(set, get),
    ...createGraphSlice(set, get),
    ...createHistorySlice(set, get),
    ...createIoSlice(set, get),
    } as WorkflowStoreState
    return nextState
  })
}

const workflowStore = createContextStore<
  WorkflowStoreState,
  WorkflowStoreInitialProps
>(createWorkflowStore)

export const WorkflowStoreProvider = workflowStore.Provider
export const useWorkflowStore = workflowStore.useStore
export const useWorkflowShallowStore = workflowStore.useShallowStore

export function useWorkflowGraph(): WorkflowGraphState {
  return useWorkflowStore((state) => state.history.present)
}
