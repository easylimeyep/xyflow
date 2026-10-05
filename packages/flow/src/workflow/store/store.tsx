import type { PropsWithChildren, ReactElement } from "react"

import { createContextStore, withHistory } from "@ez-kit/zu-store"
import { createStore } from "zustand/vanilla"

import { initialWorkflowGraph } from "../default-graph/default-graph"
import { upstreamScope } from "../expression/variables/variable-scope"
import { createNodeRegistry } from "../node-registry/registry"
import type { WorkflowGraphState } from "../types/types"
import { cloneGraphState } from "./helpers"
import { normalizeWorkflowRuntimeConfig } from "./runtime"
import {
  selectFieldSearchStatus,
  selectNodeSearchStatus,
  type FieldSearchStatus,
  type FieldSearchStatusOptions,
  type NodeSearchStatus,
} from "./search-selectors"
import { selectSelectedNode, selectSelectedNodeIds } from "./selectors"
import {
  createConnectionSlice,
  createExpressionSlice,
  createGraphSlice,
  createGroupSlice,
  createHistorySlice,
  createIntentSlice,
  createIoSlice,
  createLayoutSlice,
  createNodeCrudSlice,
  createSearchSlice,
  createSelectionSlice,
} from "./slices"
import type {
  WorkflowHistorySlice,
  WorkflowStoreApi,
  WorkflowStoreInitialProps,
  WorkflowStoreState,
} from "./types"
import { createValidationSlice } from "./validation"

export type {
  PendingEdgeInsert,
  PendingQuickAdd,
  WorkflowExportDomainMapper,
  WorkflowStoreInitialProps,
  WorkflowRuntimeConfig,
  WorkflowSearchState,
  WorkflowStoreState,
} from "./types"
export type { WorkflowValidationStoreState } from "./validation"

/**
 * How many graphs back undo reaches. Below `withHistory`'s own default of 100,
 * because a step here is a whole graph rather than a field.
 */
const HISTORY_LIMIT = 50

/**
 * The only part of the store undo/redo may touch.
 *
 * Without it `withHistory` would snapshot and restore the entire state, so an
 * undo would roll back the selection, the pending quick-add/edge-insert intents
 * and the last error along with the graph.
 */
const workflowHistorySlice = (
  state: WorkflowStoreState
): WorkflowHistorySlice => ({
  graph: state.graph,
})

export function createWorkflowStore(
  initialProps: WorkflowStoreInitialProps = {}
): WorkflowStoreApi {
  const initialGraph = cloneGraphState(
    initialProps.initialGraph ?? initialWorkflowGraph
  )
  const runtime = normalizeWorkflowRuntimeConfig(initialProps.runtime)
  const registry = createNodeRegistry(initialProps.definitions ?? [])

  return createStore<WorkflowStoreState>()(
    withHistory(
      (set, get, api) =>
        ({
          runtime,
          registry,
          graph: initialGraph,
          measuredInitialAutoLayoutAttempted: false,
          ...createExpressionSlice(
            initialGraph,
            registry,
            runtime.variables?.scope ?? upstreamScope
          ),
          ...createValidationSlice(set, get, api),
          ...createSelectionSlice(set, get, api),
          ...createIntentSlice(set, get, api),
          ...createNodeCrudSlice(set, get, api),
          ...createLayoutSlice(set, get, api),
          ...createConnectionSlice(set, get, api),
          ...createGraphSlice(set, get, api),
          ...createGroupSlice(set, get, api),
          ...createHistorySlice(set, get, api),
          ...createIoSlice(set, get, api),
          ...createSearchSlice(set, get, api),
        }) as WorkflowStoreState,
      { limit: HISTORY_LIMIT, partialize: workflowHistorySlice }
    )
  )
}

const workflowStore = createContextStore<
  WorkflowStoreApi,
  WorkflowStoreInitialProps
>(({ defaultValue }) => createWorkflowStore(defaultValue), {
  name: "workflow",
})

/**
 * Keeps this package's own prop-per-seed API (`<WorkflowStoreProvider
 * definitions={...} initialGraph={...} />`) over `createContextStore`'s single
 * `defaultValue` envelope. The store is still built once, on first render.
 */
export function WorkflowStoreProvider({
  children,
  ...initialProps
}: PropsWithChildren<WorkflowStoreInitialProps>): ReactElement {
  return (
    <workflowStore.Provider defaultValue={initialProps}>
      {children}
    </workflowStore.Provider>
  )
}

export const useWorkflowStore = workflowStore.useSelector
export const useWorkflowShallowStore = workflowStore.useShallowSelector
/**
 * The store itself, for values a component reads only inside a handler.
 * Reading through this subscribes to nothing, so the component does not
 * re-render when the value changes.
 */
export const useWorkflowStoreApi = workflowStore.useStore

export function useWorkflowGraph(): WorkflowGraphState {
  return useWorkflowStore((state) => state.graph)
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
    copyAllToClipboard: state.copyAllToClipboard,
    pasteFromClipboard: state.pasteFromClipboard,
    importFromJson: state.importFromJson,
    exportDomain: state.exportDomain,
    startQuickAddFromOutput: state.startQuickAddFromOutput,
    cancelQuickAdd: state.cancelQuickAdd,
    startEdgeInsertFromEdge: state.startEdgeInsertFromEdge,
    cancelEdgeInsert: state.cancelEdgeInsert,
  }))
}

/**
 * This node's place in the canvas search. A string, so a node re-renders only
 * when its own status flips — never because the current match moved elsewhere.
 */
export function useNodeSearchStatus(nodeId: string): NodeSearchStatus {
  return useWorkflowStore((state) => selectNodeSearchStatus(state, nodeId))
}

/** One field's place in the canvas search; see `selectFieldSearchStatus`. */
export function useFieldSearchStatus(
  nodeId: string,
  fieldKey: string,
  options?: FieldSearchStatusOptions
): FieldSearchStatus {
  const includeChildren = options?.includeChildren ?? false
  return useWorkflowStore((state) =>
    selectFieldSearchStatus(state, nodeId, fieldKey, { includeChildren })
  )
}
