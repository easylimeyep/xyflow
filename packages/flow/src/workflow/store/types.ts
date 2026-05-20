import type {
  EdgeChange,
  NodeChange,
  Viewport,
  XYPosition,
} from "@xyflow/react"
import type { StoreApi } from "@workspace/store"
import type { HistoryState } from "@workspace/store"

import type { WorkflowError } from "../types/errors"
import type {
  DomainWorkflowDTO,
  ExpressionVariableOption,
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

export type NodeConfigUpdate = {
  [K in keyof NodeConfigByKind]: {
    [P in keyof NodeConfigByKind[K] & string]: {
      kind: K
      key: P
      value: NodeConfigByKind[K][P]
    }
  }[keyof NodeConfigByKind[K] & string]
}[keyof NodeConfigByKind]

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

export interface WorkflowRuntimeConfig {
  evaluator?: WorkflowRuntimeEvaluatorConfig
  enableEvaluatorMultipleConditions?: boolean
  importDomain?: WorkflowRuntimeImportDomainConfig
  exportDomain?: WorkflowRuntimeExportDomainConfig
}

export interface WorkflowStoreQueries {
  history: HistoryState<WorkflowGraphState>
  runtime: WorkflowRuntimeConfig
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
}

export type WorkflowStoreSetState = StoreApi<WorkflowStoreState>["setState"]
export type WorkflowStoreGetState = StoreApi<WorkflowStoreState>["getState"]

export type WorkflowSliceCreator = (
  set: WorkflowStoreSetState,
  get: WorkflowStoreGetState
) => Partial<WorkflowStoreState>
