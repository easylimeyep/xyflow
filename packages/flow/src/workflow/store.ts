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
import { createWorkflowNode } from "./node-registry"
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
  selectedNodeId: string | null
  lastError: string | null
  setLastError: (message: string | null) => void
  addNode: (kind: NodeKind, position: XYPosition) => void
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
    selectedNodeId: null,
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
    setSelectedNode: (nodeId) => {
      set({ selectedNodeId: nodeId })
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
      const selectedNodeId = get().selectedNodeId
      const selectedExists =
        selectedNodeId === null || nextNodes.some((node) => node.id === selectedNodeId)
      const nextGraph: WorkflowGraphState = {
        ...currentGraph,
        nodes: nextNodes,
      }

      if (shouldCommitNodeHistory(changes)) {
        set((state) => ({
          history: pushHistoryState(state.history, cloneGraphState(nextGraph)),
          selectedNodeId: selectedExists ? state.selectedNodeId : null,
        }))
        return
      }

      set((state) => ({
        history: {
          ...state.history,
          present: nextGraph,
        },
        selectedNodeId: selectedExists ? state.selectedNodeId : null,
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
        selectedNodeId: null,
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
