import { createContextStore, createStore, createHistoryState, type StoreApi } from "@workspace/store"

import { initialWorkflowGraph } from "../default-graph/default-graph"
import type { WorkflowGraphState } from "../types/types"
import { cloneGraphState } from "./helpers"
import {
  createConnectionSlice,
  createExpressionSlice,
  createGraphSlice,
  createHistorySlice,
  createIntentSlice,
  createIoSlice,
  createNodeCrudSlice,
  createSelectionSlice,
} from "./slices"
import type { WorkflowStoreInitialProps, WorkflowStoreState } from "./types"

export type {
  PendingEdgeInsert,
  PendingQuickAdd,
  WorkflowExportDomainMapper,
  WorkflowStoreInitialProps,
  WorkflowRuntimeConfig,
  WorkflowStoreState,
} from "./types"

export function createWorkflowStore(
  initialProps: WorkflowStoreInitialProps = {}
): StoreApi<WorkflowStoreState> {
  const initialGraph = cloneGraphState(
    initialProps.initialGraph ?? initialWorkflowGraph
  )
  const runtime = initialProps.runtime ?? {}

  return createStore<WorkflowStoreState>()((set, get) => ({
    runtime,
    history: createHistoryState(initialGraph),
    ...createExpressionSlice(initialGraph),
    ...createSelectionSlice(set, get),
    ...createIntentSlice(set, get),
    ...createNodeCrudSlice(set, get),
    ...createConnectionSlice(set, get),
    ...createGraphSlice(set, get),
    ...createHistorySlice(set, get),
    ...createIoSlice(set, get),
  } as WorkflowStoreState))
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
