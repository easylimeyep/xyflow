import type { EdgeChange, NodeChange, Viewport, XYPosition } from "@xyflow/react"
import type { StoreApi } from "@workspace/store"
import type { HistoryState } from "@workspace/store"

import type {
  NodeKind,
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

export interface WorkflowStoreState {
  history: HistoryState<WorkflowGraphState>
  selectedNodeIds: string[]
  lastPointerFlowPosition: XYPosition | null
  quickAddPending: PendingQuickAdd | null
  edgeInsertPending: PendingEdgeInsert | null
  lastError: string | null
  setLastError: (message: string | null) => void
  addNode: (kind: NodeKind, position: XYPosition) => void
  startQuickAddFromOutput: (
    sourceNodeId: string,
    sourceHandle?: string | null
  ) => void
  startEdgeInsertFromEdge: (edgeId: string) => void
  cancelQuickAdd: () => void
  cancelEdgeInsert: () => void
  confirmQuickAddNode: (kind: NodeKind) => void
  confirmEdgeInsertNode: (kind: NodeKind) => void
  setSelectedNodes: (nodeIds: string[]) => void
  setSelectedNode: (nodeId: string | null) => void
  updateNodeLabel: (nodeId: string, nextLabel: string) => void
  updateNodeConfigField: (
    nodeId: string,
    key: string,
    rawValue: string | number | boolean
  ) => void
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void
  onConnect: (connection: ConnectionLike) => void
  setViewport: (viewport: Viewport) => void
  setLastPointerPosition: (position: XYPosition) => void
  copySelectionToClipboard: () => Promise<boolean>
  pasteFromClipboard: () => Promise<boolean>
  undo: () => void
  redo: () => void
  importFromJson: (rawJson: string) => boolean
  exportInternal: () => string
  exportDomain: () => string
}

export interface WorkflowStoreInitialProps {
  initialGraph?: WorkflowGraphState
}

export type WorkflowStoreSetState = StoreApi<WorkflowStoreState>["setState"]
export type WorkflowStoreGetState = StoreApi<WorkflowStoreState>["getState"]

export type WorkflowSliceCreator = (
  set: WorkflowStoreSetState,
  get: WorkflowStoreGetState
) => Partial<WorkflowStoreState>
