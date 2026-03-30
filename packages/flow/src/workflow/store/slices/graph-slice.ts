import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react"
import { pushHistoryState } from "@workspace/store"

import { createWorkflowNode } from "../../node-registry/node-registry"
import { refactorVariableReferencesInGraph } from "../../expression/refactor/refactor"
import { isValidJsIdentifier } from "../../expression/variable-name/variable-name"
import { createWorkflowError } from "../../types/errors"
import type { WorkflowEdge, WorkflowGraphState, WorkflowNode } from "../../types/types"
import { getKindsFromConnection, validateConnection, type ConnectionLike } from "../../validation/validation"
import {
  filterEdgesForRemovedNodes,
  getRemovedNodeIds,
  hasEdgeCollectionChanged,
  hasNodeCollectionChanged,
  hasOutgoingConnection,
  haveSameIdSet,
  shouldCommitEdgeHistory,
  shouldCommitNodeHistory,
  shouldSquashPreviousEdgeRemovalWithNodeRemoval,
} from "../collection-diff"
import { toEdgeConnectionWithKind } from "../dto-mappers"
import { computeEdgeInsertion } from "../edge-insertion"
import { createSmartQuickAddPosition } from "../geometry"
import { cloneGraphState, commitGraphState, replacePresentGraphState } from "../history-helpers"
import type { WorkflowSliceCreator } from "../types"

export const createGraphSlice: WorkflowSliceCreator = (set, get) => ({
  addNode: (kind, position) => {
    const currentGraph = get().history.present
    const nextNodes = [...currentGraph.nodes, createWorkflowNode(kind, position)]
    commitGraphState(set, {
      ...currentGraph,
      nodes: nextNodes,
    })
  },
  confirmQuickAddNode: (kind) => {
    const currentGraph = get().history.present
    const pending = get().quickAddPending
    if (!pending) return

    const sourceNode = currentGraph.nodes.find((node) => node.id === pending.sourceNodeId)
    if (!sourceNode) {
      set({
        quickAddPending: null,
        lastError: createWorkflowError("NODE_NOT_FOUND", "Failed to resolve source node for quick add."),
      })
      return
    }

    if (
      hasOutgoingConnection(currentGraph.edges, pending.sourceNodeId, pending.sourceHandle)
    ) {
      set({
        quickAddPending: null,
        lastError: createWorkflowError("OUTGOING_CONNECTION_EXISTS", "Selected output already has an outgoing connection."),
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
      set({ lastError: createWorkflowError("INVALID_CONNECTION", validation.reason ?? "Invalid quick add connection.") })
      return
    }

    const kinds = getKindsFromConnection(connection, nextNodes)
    if (!kinds) {
      set({
        lastError: createWorkflowError("KIND_RESOLUTION_FAILED", "Failed to resolve node kinds for quick add connection."),
      })
      return
    }

    const nextEdges = addEdge(
      toEdgeConnectionWithKind(connection, kinds.sourceKind, kinds.targetKind),
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
  confirmEdgeInsertNode: (kind) => {
    const currentGraph = get().history.present
    const pending = get().edgeInsertPending
    if (!pending) return

    const result = computeEdgeInsertion(currentGraph, pending.edgeId, kind)
    if (!result.ok) {
      set({ edgeInsertPending: null, lastError: createWorkflowError("EDGE_INSERT_FAILED", result.error) })
      return
    }

    commitGraphState(set, {
      ...currentGraph,
      nodes: result.nextNodes,
      edges: result.nextEdges,
    })
    set({
      edgeInsertPending: null,
      selectedNodeIds: [result.insertedNodeId],
      lastError: null,
    })
  },
  updateNodeLabel: (nodeId, nextLabel) => {
    const currentGraph = get().history.present
    const targetNode = currentGraph.nodes.find((node) => node.id === nodeId)
    if (!targetNode || targetNode.data.label === nextLabel) return

    const nextNodes = currentGraph.nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, label: nextLabel } }
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
    if (!targetNode) return

    const previousRawValue =
      targetNode.data.config[key as keyof typeof targetNode.data.config]
    if (Object.is(previousRawValue, rawValue)) return

    if (
      targetNode.data.kind === "setVariable" &&
      key === "variableName" &&
      typeof rawValue === "string"
    ) {
      const previousNameValue = targetNode.data.config.variableName
      const previousName =
        typeof previousNameValue === "string" ? previousNameValue.trim() : ""
      const nextName = rawValue.trim()
      if (nextName === previousName) return

      if (!isValidJsIdentifier(nextName)) {
        set({
          lastError: createWorkflowError("INVALID_VARIABLE_NAME", "Variable name must be a valid JavaScript identifier."),
        })
        return
      }

      const duplicateVariable = currentGraph.nodes.some((node) => {
        if (node.id === nodeId || node.data.kind !== "setVariable") {
          return false
        }
        const variableNameValue = node.data.config.variableName
        if (typeof variableNameValue !== "string") return false
        return variableNameValue.trim() === nextName
      })

      if (duplicateVariable) {
        set({ lastError: createWorkflowError("DUPLICATE_VARIABLE_NAME", "Variable name must be unique in this workflow.") })
        return
      }

      const nextNodesWithNewName = currentGraph.nodes.map((node) => {
        if (node.id !== nodeId) return node
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              variableName: nextName,
            },
          },
        }
      })

      const nextNodes = refactorVariableReferencesInGraph(nextNodesWithNewName, {
        sourceNodeId: nodeId,
        oldName: previousName,
        newName: nextName,
      })

      commitGraphState(set, {
        ...currentGraph,
        nodes: nextNodes,
      })
      set({ lastError: null })
      return
    }

    const nextNodes = currentGraph.nodes.map((node) => {
      if (node.id !== nodeId) return node
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
    const history = get().history
    const currentGraph = history.present
    const nextNodes = applyNodeChanges(changes, currentGraph.nodes)
    const removedNodeIds = getRemovedNodeIds(changes)
    const nextEdges = filterEdgesForRemovedNodes(currentGraph.edges, removedNodeIds)
    const selectedNodeIds = get().selectedNodeIds
    const remainingNodeIds = new Set(nextNodes.map((node) => node.id))
    const nextSelectedNodeIds = selectedNodeIds.filter((id) => remainingNodeIds.has(id))
    const nodeCollectionChanged = hasNodeCollectionChanged(currentGraph.nodes, nextNodes)
    const edgeCollectionChanged = hasEdgeCollectionChanged(currentGraph.edges, nextEdges)
    const selectionChanged = !haveSameIdSet(selectedNodeIds, nextSelectedNodeIds)
    if (!nodeCollectionChanged && !edgeCollectionChanged && !selectionChanged) return

    const nextGraph: WorkflowGraphState = {
      ...currentGraph,
      nodes: nextNodes,
      edges: nextEdges,
    }

    if (shouldCommitNodeHistory(changes)) {
      if (shouldSquashPreviousEdgeRemovalWithNodeRemoval(history, removedNodeIds)) {
        set((state) => ({
          history: {
            ...state.history,
            present: cloneGraphState(nextGraph),
            future: [],
          },
          selectedNodeIds: nextSelectedNodeIds,
        }))
        return
      }

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
    const edgeCollectionChanged = hasEdgeCollectionChanged(
      currentGraph.edges,
      nextEdges
    )
    if (!edgeCollectionChanged) return

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
      set({ lastError: createWorkflowError("INVALID_CONNECTION", validation.reason ?? "Invalid connection.") })
      return
    }

    const kinds = getKindsFromConnection(connection, currentGraph.nodes)
    if (!kinds) {
      set({ lastError: createWorkflowError("KIND_RESOLUTION_FAILED", "Failed to resolve node kinds for connection.") })
      return
    }

    const nextEdges = addEdge(
      toEdgeConnectionWithKind(connection, kinds.sourceKind, kinds.targetKind),
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
})
