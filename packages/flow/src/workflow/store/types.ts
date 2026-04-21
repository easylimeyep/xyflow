import type { EdgeChange, NodeChange, Viewport, XYPosition } from "@xyflow/react"
import type { StoreApi } from "@workspace/store"
import type { HistoryState } from "@workspace/store"

import type { WorkflowError } from "../types/errors"
import type {
  DomainWorkflowDTO,
  ExpressionVariableOption,
  NodeConfigByKind,
  NodeKind,
  WorkflowBranchOperatorOption,
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowNode,
} from "../types/types"
import type { ConnectionLike } from "../validation/validation"

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

export interface WorkflowRuntimeBranchConfig {
  operators?: WorkflowBranchOperatorOption[]
}

export interface WorkflowRuntimeConfig {
  branch?: WorkflowRuntimeBranchConfig
  importDomain?: WorkflowRuntimeImportDomainConfig
  exportDomain?: WorkflowRuntimeExportDomainConfig
}

export interface WorkflowStoreQueries {
  history: HistoryState<WorkflowGraphState>
  runtime: WorkflowRuntimeConfig
  expressionDeps: ExpressionDepsGraph
  expressionStructuralVersion: number
  expressionStructuralSignature: string
  expressionCatalogCache: Map<string, ExpressionVariableOption[]>
  selectedNodeIds: string[]
  nodeDragOriginGraph: WorkflowGraphState | null
  lastPointerFlowPosition: XYPosition | null
  quickAddPending: PendingQuickAdd | null
  edgeInsertPending: PendingEdgeInsert | null
  lastError: WorkflowError | null
}

export interface WorkflowStoreGraphCommands {
  addNode: (kind: NodeKind, position: XYPosition) => void
  updateNodeLabel: (nodeId: string, nextLabel: string) => void
  updateNodeConfig: (nodeId: string, update: NodeConfigUpdate) => void
  autoLayout: () => Promise<boolean>
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void
  onConnect: (connection: ConnectionLike) => void
  setViewport: (viewport: Viewport) => void
}

export interface WorkflowStoreUICommands {
  setLastError: (error: WorkflowError | null) => void
  setSelectedNodes: (nodeIds: string[]) => void
  setSelectedNode: (nodeId: string | null) => void
  setLastPointerPosition: (position: XYPosition) => void
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
  pasteFromClipboard: () => Promise<boolean>
  importFromJson: (rawJson: string) => boolean
  exportDomain: () => DomainWorkflowDTO
}

export interface WorkflowStoreHistoryCommands {
  undo: () => void
  redo: () => void
}

export interface WorkflowStoreState
  extends WorkflowStoreQueries,
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
