import type {
  EdgeChange,
  NodeChange,
  Viewport,
  XYPosition,
} from "@xyflow/react"
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react"
import {
  createContextStore,
  createStore,
  createHistoryState,
  pushHistoryState,
  redoHistoryState,
  type StoreApi,
  undoHistoryState,
} from "@workspace/store"

import { initialWorkflowGraph } from "./default-graph"
import { DEFAULT_NODE_WIDTH, createWorkflowNode } from "./node-registry"
import {
  exportDomainJson,
  exportInternalJson,
  parseInternalGraphJson,
} from "./mappers"
import type {
  NodeKind,
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowNode,
} from "./types"
import {
  getKindsFromConnection,
  validateConnection,
  type ConnectionLike,
} from "./validation"

export interface WorkflowStoreState {
  history: ReturnType<typeof createHistoryState<WorkflowGraphState>>
  selectedNodeIds: string[]
  quickAddPending: PendingQuickAdd | null
  lastError: string | null
  setLastError: (message: string | null) => void
  addNode: (kind: NodeKind, position: XYPosition) => void
  startQuickAddFromOutput: (sourceNodeId: string, sourceHandle?: string | null) => void
  cancelQuickAdd: () => void
  confirmQuickAddNode: (kind: NodeKind) => void
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
  undo: () => void
  redo: () => void
  importFromJson: (rawJson: string) => boolean
  exportInternal: () => string
  exportDomain: () => string
}

export interface WorkflowStoreInitialProps {
  initialGraph?: WorkflowGraphState
}

type WorkflowStoreSetState = StoreApi<WorkflowStoreState>["setState"]
export interface PendingQuickAdd {
  sourceNodeId: string
  sourceHandle: string | null
}

function cloneGraphState(graph: WorkflowGraphState): WorkflowGraphState {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        config: { ...node.data.config },
      },
      position: { ...node.position },
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      data: edge.data ? { ...edge.data } : undefined,
    })),
    viewport: { ...graph.viewport },
    document: {
      ...graph.document,
      metadata: { ...graph.document.metadata },
    },
  }
}

function commitGraphState(
  set: WorkflowStoreSetState,
  nextGraph: WorkflowGraphState
): void {
  set((state) => ({
    history: pushHistoryState(state.history, cloneGraphState(nextGraph)),
  }))
}

function replacePresentGraphState(
  set: WorkflowStoreSetState,
  nextGraph: WorkflowGraphState
): void {
  set((state) => ({
    history: {
      ...state.history,
      present: cloneGraphState(nextGraph),
    },
  }))
}

function hasOutgoingConnection(
  edges: WorkflowEdge[],
  sourceNodeId: string,
  sourceHandle: string | null
): boolean {
  return edges.some(
    (edge) =>
      edge.source === sourceNodeId && (edge.sourceHandle ?? null) === (sourceHandle ?? null)
  )
}

function getQuickAddSourceAnchorY(sourceNode: WorkflowNode, sourceHandle: string | null): number {
  const nodeHeight = sourceNode.height ?? 80
  const baseY = sourceNode.position.y

  if (sourceHandle === "branch-true") {
    return baseY + nodeHeight * 0.34
  }

  if (sourceHandle === "branch-false") {
    return baseY + nodeHeight * 0.72
  }

  return baseY + nodeHeight / 2
}

function getNodeRect(node: WorkflowNode): { left: number; right: number; top: number; bottom: number } {
  const width = node.width ?? DEFAULT_NODE_WIDTH
  const height = node.height ?? 80
  return {
    left: node.position.x,
    right: node.position.x + width,
    top: node.position.y,
    bottom: node.position.y + height,
  }
}

function hasPlacementCollision(
  existingNodes: WorkflowNode[],
  candidatePosition: XYPosition,
  margin = 24
): boolean {
  const candidateWidth = DEFAULT_NODE_WIDTH
  const candidateHeight = 80
  const candidateRect = {
    left: candidatePosition.x,
    right: candidatePosition.x + candidateWidth,
    top: candidatePosition.y,
    bottom: candidatePosition.y + candidateHeight,
  }

  return existingNodes.some((node) => {
    const rect = getNodeRect(node)
    return !(
      candidateRect.right + margin < rect.left ||
      candidateRect.left - margin > rect.right ||
      candidateRect.bottom + margin < rect.top ||
      candidateRect.top - margin > rect.bottom
    )
  })
}

function createSmartQuickAddPosition(
  nodes: WorkflowNode[],
  sourceNode: WorkflowNode,
  sourceHandle: string | null
): XYPosition {
  const sourceWidth = sourceNode.width ?? DEFAULT_NODE_WIDTH
  const sourceAnchorY = getQuickAddSourceAnchorY(sourceNode, sourceHandle)
  const baseX = sourceNode.position.x + sourceWidth + 180
  const candidateOffsets = [0, -140, 140, -280, 280, -420, 420]

  for (const offsetY of candidateOffsets) {
    const candidate = { x: baseX, y: sourceAnchorY - 40 + offsetY }
    if (!hasPlacementCollision(nodes, candidate)) {
      return candidate
    }
  }

  return { x: baseX, y: sourceAnchorY + 480 }
}

function shouldCommitNodeHistory(changes: NodeChange<WorkflowNode>[]): boolean {
  return changes.some((change) => {
    if (change.type === "add" || change.type === "remove" || change.type === "replace") {
      return true
    }

    if (change.type === "position") {
      return change.dragging === false
    }

    return false
  })
}

function shouldCommitEdgeHistory(changes: EdgeChange<WorkflowEdge>[]): boolean {
  return changes.some(
    (change) => change.type === "add" || change.type === "remove" || change.type === "replace"
  )
}

export function createWorkflowStore(
  initialProps: WorkflowStoreInitialProps = {}
): StoreApi<WorkflowStoreState> {
  const initialGraph = cloneGraphState(initialProps.initialGraph ?? initialWorkflowGraph)

  return createStore<WorkflowStoreState>()((set, get) => ({
    history: createHistoryState(initialGraph),
    selectedNodeIds: [],
    quickAddPending: null,
    lastError: null,
    setLastError: (message) => set({ lastError: message }),
    addNode: (kind, position) => {
      const currentGraph = get().history.present
      const nextNodes = [...currentGraph.nodes, createWorkflowNode(kind, position)]

      commitGraphState(set, {
        ...currentGraph,
        nodes: nextNodes,
      })
    },
    startQuickAddFromOutput: (sourceNodeId, sourceHandle = null) => {
      const currentGraph = get().history.present
      const sourceNode = currentGraph.nodes.find((node) => node.id === sourceNodeId)
      if (!sourceNode) {
        return
      }

      const normalizedHandle = sourceHandle ?? null
      if (hasOutgoingConnection(currentGraph.edges, sourceNodeId, normalizedHandle)) {
        return
      }

      set({
        quickAddPending: {
          sourceNodeId,
          sourceHandle: normalizedHandle,
        },
      })
    },
    cancelQuickAdd: () => {
      if (!get().quickAddPending) {
        return
      }

      set({ quickAddPending: null })
    },
    confirmQuickAddNode: (kind) => {
      const currentGraph = get().history.present
      const pending = get().quickAddPending
      if (!pending) {
        return
      }

      const sourceNode = currentGraph.nodes.find((node) => node.id === pending.sourceNodeId)
      if (!sourceNode) {
        set({
          quickAddPending: null,
          lastError: "Failed to resolve source node for quick add.",
        })
        return
      }

      if (hasOutgoingConnection(currentGraph.edges, pending.sourceNodeId, pending.sourceHandle)) {
        set({
          quickAddPending: null,
          lastError: "Selected output already has an outgoing connection.",
        })
        return
      }

      const nextNodePosition = createSmartQuickAddPosition(
        currentGraph.nodes,
        sourceNode,
        pending.sourceHandle
      )
      const nextNode = createWorkflowNode(kind, nextNodePosition)
      const nextNodes = [...currentGraph.nodes, nextNode]
      const connection: ConnectionLike = {
        source: pending.sourceNodeId,
        target: nextNode.id,
        sourceHandle: pending.sourceHandle,
        targetHandle: null,
      }
      const validation = validateConnection(connection, nextNodes, currentGraph.edges)
      if (!validation.valid) {
        set({ lastError: validation.reason ?? "Invalid quick add connection." })
        return
      }

      const kinds = getKindsFromConnection(connection, nextNodes)
      if (!kinds) {
        set({ lastError: "Failed to resolve node kinds for quick add connection." })
        return
      }

      const nextEdges = addEdge(
        {
          ...connection,
          sourceHandle: connection.sourceHandle ?? null,
          targetHandle: connection.targetHandle ?? null,
          data: {
            sourceKind: kinds.sourceKind,
            targetKind: kinds.targetKind,
          },
        },
        currentGraph.edges
      ) as WorkflowEdge[]

      commitGraphState(set, {
        ...currentGraph,
        nodes: nextNodes,
        edges: nextEdges,
      })
      set({
        quickAddPending: null,
        selectedNodeIds: [nextNode.id],
        lastError: null,
      })
    },
    setSelectedNodes: (nodeIds) => {
      set({ selectedNodeIds: [...nodeIds] })
    },
    setSelectedNode: (nodeId) => {
      set({ selectedNodeIds: nodeId ? [nodeId] : [] })
    },
    updateNodeLabel: (nodeId, nextLabel) => {
      const currentGraph = get().history.present
      const nextNodes = currentGraph.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label: nextLabel,
              },
            }
          : node
      )

      commitGraphState(set, {
        ...currentGraph,
        nodes: nextNodes,
      })
    },
    updateNodeConfigField: (nodeId, key, rawValue) => {
      const currentGraph = get().history.present
      const targetNode = currentGraph.nodes.find((node) => node.id === nodeId)
      if (!targetNode) {
        return
      }

      const nextNodes = currentGraph.nodes.map((node) => {
        if (node.id !== nodeId) {
          return node
        }

        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              [key]: rawValue,
            },
          },
        }
      })

      commitGraphState(set, {
        ...currentGraph,
        nodes: nextNodes,
      })
    },
    onNodesChange: (changes) => {
      const currentGraph = get().history.present
      const nextNodes = applyNodeChanges(changes, currentGraph.nodes)
      const selectedNodeIds = get().selectedNodeIds
      const remainingNodeIds = new Set(nextNodes.map((node) => node.id))
      const nextSelectedNodeIds = selectedNodeIds.filter((id) => remainingNodeIds.has(id))
      const nextGraph: WorkflowGraphState = {
        ...currentGraph,
        nodes: nextNodes,
      }

      if (shouldCommitNodeHistory(changes)) {
        set((state) => ({
          history: pushHistoryState(state.history, cloneGraphState(nextGraph)),
          selectedNodeIds: nextSelectedNodeIds,
        }))
        return
      }

      set((state) => ({
        history: {
          ...state.history,
          present: nextGraph,
        },
        selectedNodeIds: nextSelectedNodeIds,
      }))
    },
    onEdgesChange: (changes) => {
      const currentGraph = get().history.present
      const nextEdges = applyEdgeChanges(changes, currentGraph.edges)

      const nextGraph: WorkflowGraphState = {
        ...currentGraph,
        edges: nextEdges,
      }

      if (shouldCommitEdgeHistory(changes)) {
        commitGraphState(set, nextGraph)
        return
      }

      replacePresentGraphState(set, nextGraph)
    },
    onConnect: (connection) => {
      const currentGraph = get().history.present
      const validation = validateConnection(
        connection,
        currentGraph.nodes,
        currentGraph.edges
      )
      if (!validation.valid) {
        set({ lastError: validation.reason ?? "Invalid connection." })
        return
      }

      const kinds = getKindsFromConnection(connection, currentGraph.nodes)
      if (!kinds) {
        set({ lastError: "Failed to resolve node kinds for connection." })
        return
      }

      const nextEdges = addEdge(
        {
          ...connection,
          sourceHandle: connection.sourceHandle ?? null,
          targetHandle: connection.targetHandle ?? null,
          data: {
            sourceKind: kinds.sourceKind,
            targetKind: kinds.targetKind,
          },
        },
        currentGraph.edges
      ) as WorkflowEdge[]

      commitGraphState(set, {
        ...currentGraph,
        edges: nextEdges,
      })
      set({ lastError: null })
    },
    setViewport: (viewport) => {
      set((state) => {
        const currentViewport = state.history.present.viewport
        if (
          currentViewport.x === viewport.x &&
          currentViewport.y === viewport.y &&
          currentViewport.zoom === viewport.zoom
        ) {
          return state
        }

        return {
          history: {
            ...state.history,
            present: {
              ...state.history.present,
              viewport: {
                x: viewport.x,
                y: viewport.y,
                zoom: viewport.zoom,
              },
            },
          },
        }
      })
    },
    undo: () => {
      set((state) => ({
        history: undoHistoryState(state.history),
        lastError: null,
      }))
    },
    redo: () => {
      set((state) => ({
        history: redoHistoryState(state.history),
        lastError: null,
      }))
    },
    importFromJson: (rawJson) => {
      const parsed = parseInternalGraphJson(rawJson)
      if (!parsed.success || !parsed.value) {
        set({
          lastError: parsed.error ?? "Import failed due to invalid schema.",
        })
        return false
      }

      const importedGraph = cloneGraphState(parsed.value)
      set({
        history: createHistoryState(importedGraph),
        selectedNodeIds: [],
        lastError: null,
      })
      return true
    },
    exportInternal: () => {
      return exportInternalJson(get().history.present)
    },
    exportDomain: () => {
      return exportDomainJson(get().history.present)
    },
  }))
}

const workflowStore = createContextStore<WorkflowStoreState, WorkflowStoreInitialProps>(
  createWorkflowStore
)

export const WorkflowStoreProvider = workflowStore.Provider
export const useWorkflowStore = workflowStore.useStore
export const useWorkflowShallowStore = workflowStore.useShallowStore

export function useWorkflowGraph(): WorkflowGraphState {
  return useWorkflowStore((state) => state.history.present)
}
