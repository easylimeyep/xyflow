import {
  createContextStore,
  createStore,
  createHistoryState,
  type StoreApi,
} from "@flow/store"

import { initialWorkflowGraph } from "../default-graph/default-graph"
import { upstreamScope } from "../expression/variables/variable-scope"
import { createNodeRegistry } from "../node-registry/registry"
import type { WorkflowGraphState } from "../types/types"
import { cloneGraphState } from "./helpers"
import { normalizeWorkflowRuntimeConfig } from "./runtime"
import { selectSelectedNode, selectSelectedNodeIds } from "./selectors"
import {
  createConnectionSlice,
  createExpressionSlice,
  createGraphSlice,
  createHistorySlice,
  createIntentSlice,
  createIoSlice,
  createLayoutSlice,
  createNodeCrudSlice,
  createSelectionSlice,
} from "./slices"
import type { WorkflowStoreInitialProps, WorkflowStoreState } from "./types"
import { createValidationSlice } from "./validation"

export type {
  PendingEdgeInsert,
  PendingQuickAdd,
  WorkflowExportDomainMapper,
  WorkflowStoreInitialProps,
  WorkflowRuntimeConfig,
  WorkflowStoreState,
} from "./types"
export type { WorkflowValidationStoreState } from "./validation"

export function createWorkflowStore(
  initialProps: WorkflowStoreInitialProps = {}
): StoreApi<WorkflowStoreState> {
  const initialGraph = cloneGraphState(
    initialProps.initialGraph ?? initialWorkflowGraph
  )
  const runtime = normalizeWorkflowRuntimeConfig(initialProps.runtime)
  const registry = createNodeRegistry(initialProps.definitions ?? [])

  return createStore<WorkflowStoreState>()(
    (set, get) =>
      ({
        runtime,
        registry,
        history: createHistoryState(initialGraph),
        measuredInitialAutoLayoutAttempted: false,
        ...createExpressionSlice(
          initialGraph,
          registry,
          runtime.variables?.scope ?? upstreamScope
        ),
        ...createValidationSlice(set, get),
        ...createSelectionSlice(set, get),
        ...createIntentSlice(set, get),
        ...createNodeCrudSlice(set, get),
        ...createLayoutSlice(set, get),
        ...createConnectionSlice(set, get),
        ...createGraphSlice(set, get),
        ...createHistorySlice(set, get),
        ...createIoSlice(set, get),
      }) as WorkflowStoreState
  )
}

const workflowStore = createContextStore<
  WorkflowStoreState,
  WorkflowStoreInitialProps
>(createWorkflowStore)

export const WorkflowStoreProvider = workflowStore.Provider
export const useWorkflowStore = workflowStore.useStore
export const useWorkflowShallowStore = workflowStore.useShallowStore
/**
 * The store itself, for values a component reads only inside a handler.
 * Reading through this subscribes to nothing, so the component does not
 * re-render when the value changes.
 */
export const useWorkflowStoreApi = workflowStore.useStoreApi

export function useWorkflowGraph(): WorkflowGraphState {
  return useWorkflowStore((state) => state.history.present)
}

export function useWorkflowSelection() {
  return useWorkflowShallowStore((state) => ({
    selectedNodeIds: selectSelectedNodeIds(state),
    selectedNode: selectSelectedNode(state),
  }))
}

export function useWorkflowActions() {
  return useWorkflowShallowStore((state) => ({
    undo: state.undo,
    redo: state.redo,
    addNode: state.addNode,
    duplicateNodes: state.duplicateNodes,
    deleteNodes: state.deleteNodes,
    autoLayout: state.autoLayout,
    measuredInitialAutoLayout: state.measuredInitialAutoLayout,
    setSelectedNodes: state.setSelectedNodes,
    copySelectionToClipboard: state.copySelectionToClipboard,
    pasteFromClipboard: state.pasteFromClipboard,
    importFromJson: state.importFromJson,
    exportDomain: state.exportDomain,
    startQuickAddFromOutput: state.startQuickAddFromOutput,
    cancelQuickAdd: state.cancelQuickAdd,
    startEdgeInsertFromEdge: state.startEdgeInsertFromEdge,
    cancelEdgeInsert: state.cancelEdgeInsert,
  }))
}
