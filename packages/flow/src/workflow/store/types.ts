import type {
  EdgeChange,
  NodeChange,
  Viewport,
  XYPosition,
} from "@xyflow/react"
import type { StoreHistory } from "@ez-kit/zu-store"
import type { StoreApi } from "zustand/vanilla"

import type { NodeDefinition } from "../node-registry/define-node"
import type { NodeRegistry } from "../node-registry/registry"
import type { VariableScopeResolver } from "../expression/variables/variable-scope"
import type { WorkflowError } from "../types/errors"
import type {
  DomainWorkflowDTO,
  ExpressionVariableOption,
  FieldOption,
  JsonValue,
  NodeConfigByKind,
  NodeKind,
  WorkflowEvaluatorOperatorCatalog,
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowNode,
  WorkflowValidationSnapshot,
} from "../types/types"
import type {
  SearchMatchOptions,
  SearchMatchSource,
  SearchSortTuple,
} from "../search/matches"
import type { ConnectionLike } from "../validation/validation"
import type { WorkflowValidationStoreState } from "./validation"

export interface PendingQuickAdd {
  sourceNodeId: string
  sourceHandle: string | null
}

export interface PendingEdgeInsert {
  edgeId: string
}

type BuiltinNodeConfigUpdate = {
  [K in keyof NodeConfigByKind]: {
    [P in keyof NodeConfigByKind[K] & string]: {
      kind: K
      key: P
      value: NodeConfigByKind[K][P]
    }
  }[keyof NodeConfigByKind[K] & string]
}[keyof NodeConfigByKind]

/**
 * A config update for a kind registered by a consumer.
 *
 * The package cannot know that kind's config shape — it is declared by the
 * definition's `fields` and checked by its `validateConfigValue` — so the
 * payload is typed structurally. A built-in kind cannot be excluded from
 * `string` at the type level, so this arm also admits a built-in payload that
 * does not match its exact per-key type; `applyUpdateNodeConfigCommand`
 * rejects it at runtime through the definition's own value check, as it does
 * for every other invalid value.
 */
interface RegisteredNodeConfigUpdate {
  kind: string
  key: string
  value: JsonValue
}

export type NodeConfigUpdate =
  | BuiltinNodeConfigUpdate
  | RegisteredNodeConfigUpdate

export interface ExpressionDepsNode {
  id: string
  kind: string
  label: string
  config: Record<string, unknown>
}

export interface ExpressionDepsEdge {
  id: string
  source: string
  target: string
  sourceHandle: string | null
  targetHandle: string | null
}

export interface ExpressionDepsGraph {
  nodes: ExpressionDepsNode[]
  edges: ExpressionDepsEdge[]
}

export type WorkflowExportDomainMapper = (
  payload: DomainWorkflowDTO
) => DomainWorkflowDTO

export type WorkflowImportDomainMapper = (
  payload: DomainWorkflowDTO
) => DomainWorkflowDTO

export interface WorkflowRuntimeExportDomainConfig {
  mapper?: WorkflowExportDomainMapper
}

export interface WorkflowRuntimeImportDomainConfig {
  mapper?: WorkflowImportDomainMapper
}

export interface WorkflowRuntimeEvaluatorConfig {
  operators?: WorkflowEvaluatorOperatorCatalog
}

/**
 * Host-supplied choices for the select-backed config keys of a node kind,
 * keyed by kind and then by config key:
 *
 * ```ts
 * runtime={{ nodeOptions: { pathExtractor: { outputType: [...] } } }}
 * ```
 *
 * A kind or a key left out keeps the vocabulary the node ships with. An empty
 * list is honoured as an empty list — these catalogs usually come from a
 * server, and a host that hands over `[]` (the request failed, or there really
 * are no choices) must not have the built-in values offered in its place; the
 * node renders a disabled select holding whatever it already stored. Only a
 * value that is not a list at all is discarded as malformed.
 *
 * Evaluator operators are NOT here: they carry `allowTypes` and keep their own
 * richer catalog under `evaluator.operators`.
 */
export type WorkflowNodeOptionsCatalog = Record<
  NodeKind,
  Record<string, FieldOption[]>
>

export interface WorkflowRuntimeVariablesConfig {
  /**
   * Which nodes may contribute variables to the node being edited.
   *
   * Defaults to `upstreamScope` — only what the graph routes into the node.
   * `graphScope` offers every variable on the canvas instead, and a host may
   * pass its own resolver.
   */
  scope?: VariableScopeResolver
}

export interface WorkflowRuntimeConfig {
  evaluator?: WorkflowRuntimeEvaluatorConfig
  nodeOptions?: WorkflowNodeOptionsCatalog
  enableEvaluatorMultipleConditions?: boolean
  importDomain?: WorkflowRuntimeImportDomainConfig
  exportDomain?: WorkflowRuntimeExportDomainConfig
  variables?: WorkflowRuntimeVariablesConfig
}

/**
 * Canvas search UI state. Lives outside `history`: opening, typing and
 * stepping never touch the graph or the undo stack. The match list itself is
 * derived (see `selectSearchMatches`), never stored.
 */
export interface WorkflowSearchState {
  isOpen: boolean
  query: string
  /** Key of the match the user last moved to; `null` means "the first". */
  currentKey: string | null
  /** Where that match sorted, so a removed match has a well-defined successor. */
  currentSortTuple: SearchSortTuple | null
  /** Whether the results panel under the bar is expanded. Survives closing. */
  isResultsOpen: boolean
  /** How the query is compared with the text. Survives closing. */
  options: SearchMatchOptions
  /** Which sources count as matches. Survives closing. */
  sources: SearchSourceFilter
}

/** Per source, whether its occurrences count as matches. */
export type SearchSourceFilter = Readonly<Record<SearchMatchSource, boolean>>

export interface WorkflowStoreQueries {
  /**
   * The graph the canvas renders. This is the only field history tracks — see
   * `workflowHistorySlice` in `./store`.
   */
  graph: WorkflowGraphState
  runtime: WorkflowRuntimeConfig
  /** The node vocabulary this editor instance was created with. */
  registry: NodeRegistry
  measuredInitialAutoLayoutAttempted: boolean
  expressionDeps: ExpressionDepsGraph
  expressionStructuralVersion: number
  expressionStructuralSignature: string
  expressionCatalogCache: Map<string, ExpressionVariableOption[]>
  expressionVariableTypesCache: Map<string, Record<string, string>>
  selectedNodeIds: string[]
  nodeDragOriginGraph: WorkflowGraphState | null
  quickAddPending: PendingQuickAdd | null
  edgeInsertPending: PendingEdgeInsert | null
  lastError: WorkflowError | null
  validation: WorkflowValidationStoreState
  search: WorkflowSearchState
}

export interface WorkflowStoreGraphCommands {
  addNode: (kind: NodeKind, position: XYPosition) => void
  duplicateNodes: (nodeIds?: string[]) => boolean
  deleteNodes: (nodeIds?: string[]) => boolean
  updateNodeLabel: (nodeId: string, nextLabel: string) => void
  updateNodeConfig: (nodeId: string, update: NodeConfigUpdate) => void
  autoLayout: () => Promise<boolean>
  measuredInitialAutoLayout: () => Promise<boolean>
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void
  onConnect: (connection: ConnectionLike) => void
  setViewport: (viewport: Viewport) => void
}

export interface WorkflowStoreUICommands {
  setLastError: (error: WorkflowError | null) => void
  setValidation: (validation: WorkflowValidationSnapshot | null) => void
  hideValidationForNode: (nodeId: string) => void
  hideValidationForNodes: (nodeIds: string[]) => void
  hideGlobalValidation: () => void
  hideAllValidation: () => void
  setSelectedNodes: (nodeIds: string[]) => void
  setSelectedNode: (nodeId: string | null) => void
  startQuickAddFromOutput: (
    sourceNodeId: string,
    sourceHandle?: string | null
  ) => void
  startEdgeInsertFromEdge: (edgeId: string) => void
  cancelQuickAdd: () => void
  cancelEdgeInsert: () => void
  confirmQuickAddNode: (kind: NodeKind) => void
  confirmEdgeInsertNode: (kind: NodeKind) => void
}

export interface WorkflowStoreSearchCommands {
  openSearch: () => void
  /** Closes the search and clears the query, which removes every mark. */
  closeSearch: () => void
  setSearchQuery: (query: string) => void
  /** Moves to the next match, wrapping from the last to the first. */
  searchNext: () => void
  /** Moves to the previous match, wrapping from the first to the last. */
  searchPrev: () => void
  /** Selects the node holding the current match. */
  selectCurrentSearchNode: () => void
  /**
   * Stores the current match's key and sort position once it has been
   * worked out from the latest graph. From then on it is kept by that key:
   * an edit elsewhere cannot move it, and neither can undoing a removal of a
   * match the user had already moved past.
   */
  syncSearchCurrentMatch: () => void
  /** Makes the match with `key` current; an unknown key changes nothing. */
  setSearchCurrentMatch: (key: string) => void
  /** Expands or collapses the results panel. */
  toggleSearchResults: () => void
  setSearchOption: (name: keyof SearchMatchOptions, value: boolean) => void
  setSearchSources: (sources: SearchSourceFilter) => void
  /** Turns every source back on. */
  resetSearchSources: () => void
}

export interface WorkflowStoreIOCommands {
  copySelectionToClipboard: () => Promise<boolean>
  pasteFromClipboard: (anchor?: XYPosition | null) => Promise<boolean>
  importFromJson: (rawJson: string) => boolean
  exportDomain: () => DomainWorkflowDTO
}

export interface WorkflowStoreHistoryCommands {
  undo: () => void
  redo: () => void
}

export interface WorkflowStoreState
  extends
    WorkflowStoreQueries,
    WorkflowStoreGraphCommands,
    WorkflowStoreUICommands,
    WorkflowStoreIOCommands,
    WorkflowStoreSearchCommands,
    WorkflowStoreHistoryCommands {}

export interface WorkflowStoreInitialProps {
  initialGraph?: WorkflowGraphState
  runtime?: WorkflowRuntimeConfig
  /**
   * The node vocabulary this editor instance offers.
   *
   * Empty by default (ADR-0005): every kind an editor knows arrives here, from
   * the host. Two editors on one page may legitimately hold different
   * vocabularies, which is why this is an instance prop and not a module store.
   */
  definitions?: readonly NodeDefinition[]
}

/**
 * The part of the store `withHistory` records. Everything outside it — selection,
 * pending intents, the last error, the derived expression caches — is left alone
 * by undo/redo, which is why it is a slice and not the whole state.
 */
export interface WorkflowHistorySlice {
  graph: WorkflowGraphState
}

/**
 * The store handle, including the `history` sub-store `withHistory` attaches to
 * it. Slices reach for it to drive undo/redo and to suppress recording.
 */
export type WorkflowStoreApi = StoreApi<WorkflowStoreState> & {
  history: StoreApi<StoreHistory<WorkflowHistorySlice>>
}

export type WorkflowStoreSetState = StoreApi<WorkflowStoreState>["setState"]
export type WorkflowStoreGetState = StoreApi<WorkflowStoreState>["getState"]

export type WorkflowSliceCreator = (
  set: WorkflowStoreSetState,
  get: WorkflowStoreGetState,
  api: WorkflowStoreApi
) => Partial<WorkflowStoreState>
