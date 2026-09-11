import type {
  EdgeChange,
  NodeChange,
  Viewport,
  XYPosition,
} from "@xyflow/react"
import type { StoreApi } from "@flow/store"
import type { HistoryState } from "@flow/store"

import type { NodeDefinition } from "../node-registry/define-node"
import type { NodeRegistry } from "../node-registry/registry"
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

export interface WorkflowRuntimeConfig {
  evaluator?: WorkflowRuntimeEvaluatorConfig
  nodeOptions?: WorkflowNodeOptionsCatalog
  enableEvaluatorMultipleConditions?: boolean
  importDomain?: WorkflowRuntimeImportDomainConfig
  exportDomain?: WorkflowRuntimeExportDomainConfig
}

export interface WorkflowStoreQueries {
  history: HistoryState<WorkflowGraphState>
  runtime: WorkflowRuntimeConfig
  /** The node vocabulary this editor instance was created with. */
  registry: NodeRegistry
  measuredInitialAutoLayoutAttempted: boolean
  expressionDeps: ExpressionDepsGraph
  expressionStructuralVersion: number
  expressionStructuralSignature: string
  expressionCatalogCache: Map<string, ExpressionVariableOption[]>
  selectedNodeIds: string[]
  nodeDragOriginGraph: WorkflowGraphState | null
  quickAddPending: PendingQuickAdd | null
  edgeInsertPending: PendingEdgeInsert | null
  lastError: WorkflowError | null
  validation: WorkflowValidationStoreState
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

export type WorkflowStoreSetState = StoreApi<WorkflowStoreState>["setState"]
export type WorkflowStoreGetState = StoreApi<WorkflowStoreState>["getState"]

export type WorkflowSliceCreator = (
  set: WorkflowStoreSetState,
  get: WorkflowStoreGetState
) => Partial<WorkflowStoreState>
