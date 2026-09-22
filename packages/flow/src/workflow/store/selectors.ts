import type {
  ExpressionVariableOption,
  NormalizedWorkflowNodeValidationMessage,
  NormalizedWorkflowValidationMessage,
  WorkflowEdge,
  WorkflowNode,
} from "../types/types"
import type { NodeRegistry } from "../node-registry/registry"
import type { WorkflowStoreState } from "./types"
import {
  isValidationMessageVisible,
  type WorkflowValidationStoreState,
} from "./validation"

// The visible-validation selectors run through `useWorkflowStore`, which
// compares with `Object.is`. A freshly filtered array per call made every
// subscriber re-render on every store change — which is how selecting one node
// used to re-render every node on the canvas.
//
// The answer is therefore memoised per validation state. `state.validation` is
// replaced wholesale whenever a snapshot arrives or a message is hidden, and
// `isValidationMessageVisible` reads nothing else, so that object is the whole
// cache key; a WeakMap lets a superseded state take its entry with it.
// Emptiness has one shared answer, so a canvas with no validation at all hands
// out a single array rather than one per node; treat it as read-only.
interface VisibleValidationCache {
  global?: NormalizedWorkflowValidationMessage[]
  byNodeId: Map<string, NormalizedWorkflowNodeValidationMessage[]>
}

const visibleValidationCaches = new WeakMap<
  WorkflowValidationStoreState,
  VisibleValidationCache
>()

function visibleValidationCacheFor(
  validation: WorkflowValidationStoreState
): VisibleValidationCache {
  const existing = visibleValidationCaches.get(validation)
  if (existing) {
    return existing
  }

  const cache: VisibleValidationCache = { byNodeId: new Map() }
  visibleValidationCaches.set(validation, cache)
  return cache
}

function filterVisible<TMessage extends { key: string }>(
  state: WorkflowStoreState,
  messages: TMessage[] | undefined,
  emptyAnswer: TMessage[]
): TMessage[] {
  if (messages === undefined || messages.length === 0) {
    return emptyAnswer
  }

  const visible = messages.filter((message) =>
    isValidationMessageVisible(state, message)
  )
  return visible.length === 0 ? emptyAnswer : visible
}

const EMPTY_GLOBAL_VALIDATION_MESSAGES: NormalizedWorkflowValidationMessage[] =
  []
const EMPTY_NODE_VALIDATION_MESSAGES: NormalizedWorkflowNodeValidationMessage[] =
  []

export function selectNodeRegistry(state: WorkflowStoreState): NodeRegistry {
  return state.registry
}

export const selectCanUndo = (state: WorkflowStoreState): boolean =>
  state.history.past.length > 0

export const selectCanRedo = (state: WorkflowStoreState): boolean =>
  state.history.future.length > 0

export const selectLastError = (state: WorkflowStoreState) => state.lastError

export const selectLastErrorMessage = (
  state: WorkflowStoreState
): string | null => state.lastError?.message ?? null

export const selectVisibleGlobalValidationMessages = (
  state: WorkflowStoreState
): NormalizedWorkflowValidationMessage[] => {
  const cache = visibleValidationCacheFor(state.validation)
  if (cache.global === undefined) {
    cache.global = filterVisible(
      state,
      state.validation.server?.global,
      EMPTY_GLOBAL_VALIDATION_MESSAGES
    )
  }

  return cache.global
}

export const selectPresentNodes = (state: WorkflowStoreState): WorkflowNode[] =>
  state.history.present.nodes

export const selectPresentEdges = (state: WorkflowStoreState): WorkflowEdge[] =>
  state.history.present.edges

export const selectViewport = (state: WorkflowStoreState) =>
  state.history.present.viewport

export const selectNodeCount = (state: WorkflowStoreState): number =>
  state.history.present.nodes.length

export const selectSelectedNodeIds = (state: WorkflowStoreState): string[] =>
  state.selectedNodeIds

export const selectSelectedSingleNodeId = (
  state: WorkflowStoreState
): string | null =>
  state.selectedNodeIds.length === 1 ? (state.selectedNodeIds[0] ?? null) : null

export const selectQuickAddPending = (state: WorkflowStoreState) =>
  state.quickAddPending

export const selectEdgeInsertPending = (state: WorkflowStoreState) =>
  state.edgeInsertPending

export const selectIsEdgeInsertActive = (state: WorkflowStoreState): boolean =>
  state.edgeInsertPending !== null

export const selectSelectedNode = (
  state: WorkflowStoreState
): WorkflowNode | null => {
  const selectedNodeId = selectSelectedSingleNodeId(state)
  if (!selectedNodeId) return null
  return (
    state.history.present.nodes.find((node) => node.id === selectedNodeId) ??
    null
  )
}

export const selectVisibleValidationMessagesForNode = (
  state: WorkflowStoreState,
  nodeId: string
): NormalizedWorkflowNodeValidationMessage[] => {
  const cache = visibleValidationCacheFor(state.validation)
  const cached = cache.byNodeId.get(nodeId)
  if (cached !== undefined) {
    return cached
  }

  const visible = filterVisible(
    state,
    state.validation.server?.nodesById[nodeId],
    EMPTY_NODE_VALIDATION_MESSAGES
  )
  cache.byNodeId.set(nodeId, visible)
  return visible
}

export const selectNodeHasVisibleValidation = (
  state: WorkflowStoreState,
  nodeId: string
): boolean => selectVisibleValidationMessagesForNode(state, nodeId).length > 0

// Stable references for cache misses: these selectors run through
// `useWorkflowStore`, which compares with `Object.is`, so a fresh empty literal
// per call would re-render every subscriber on every store change. Shared by
// reference across every component that hits an empty catalog, so treat them as
// read-only.
const EMPTY_VARIABLE_OPTIONS: ExpressionVariableOption[] = []
const EMPTY_VARIABLE_TYPES: Record<string, string> = {}

export const selectExpressionVariablesForNode = (
  state: WorkflowStoreState,
  nodeId: string | null
): ExpressionVariableOption[] => {
  const cacheKey = nodeId ?? "__global__"
  return state.expressionCatalogCache.get(cacheKey) ?? EMPTY_VARIABLE_OPTIONS
}

export const selectExpressionVariableTypesForNode = (
  state: WorkflowStoreState,
  nodeId: string | null
): Record<string, string> => {
  const cacheKey = nodeId ?? "__global__"
  return (
    state.expressionVariableTypesCache.get(cacheKey) ?? EMPTY_VARIABLE_TYPES
  )
}

/**
 * The label of the single node feeding `nodeId`. Returns `null` when the node
 * has no incoming edge, or more than one, because a badge naming "the previous
 * node" would be wrong in both cases.
 */
export const selectSingleUpstreamNodeLabel = (
  state: WorkflowStoreState,
  nodeId: string
): string | null => {
  const { nodes, edges } = state.history.present

  let sourceId: string | null = null
  for (const edge of edges) {
    if (edge.target !== nodeId) continue
    if (sourceId !== null) return null
    sourceId = edge.source
  }

  if (!sourceId) return null
  return nodes.find((node) => node.id === sourceId)?.data.label ?? null
}
