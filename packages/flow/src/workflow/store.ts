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
import { refactorVariableReferencesInGraph } from "./expression/refactor"
import { isValidJsIdentifier } from "./expression/variable-name"
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
  edgeInsertPending: PendingEdgeInsert | null
  lastError: string | null
  setLastError: (message: string | null) => void
  addNode: (kind: NodeKind, position: XYPosition) => void
  startQuickAddFromOutput: (sourceNodeId: string, sourceHandle?: string | null) => void
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

export interface PendingEdgeInsert {
  edgeId: string
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

function getNodeCenter(node: WorkflowNode): XYPosition {
  const width = node.width ?? DEFAULT_NODE_WIDTH
  const height = node.height ?? 80
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  }
}

function createNodeRectAtPosition(position: XYPosition): {
  left: number
  right: number
  top: number
  bottom: number
} {
  const width = DEFAULT_NODE_WIDTH
  const height = 80
  return {
    left: position.x,
    right: position.x + width,
    top: position.y,
    bottom: position.y + height,
  }
}

function getEdgeSplitInsertPosition(sourceNode: WorkflowNode, targetNode: WorkflowNode): XYPosition {
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)
  const centerX = (sourceCenter.x + targetCenter.x) / 2
  const centerY = (sourceCenter.y + targetCenter.y) / 2

  return {
    x: centerX - DEFAULT_NODE_WIDTH / 2,
    y: centerY - 40,
  }
}

function collectDescendantNodeIds(startNodeId: string, edges: WorkflowEdge[]): Set<string> {
  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    const nextTargets = adjacency.get(edge.source) ?? []
    nextTargets.push(edge.target)
    adjacency.set(edge.source, nextTargets)
  }

  const visited = new Set<string>()
  const queue = [startNodeId]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current)) {
      continue
    }

    visited.add(current)
    const nextTargets = adjacency.get(current) ?? []
    queue.push(...nextTargets)
  }

  return visited
}

function shiftNodesBySubgraph(
  nodes: WorkflowNode[],
  nodeIds: Set<string>,
  shiftX: number
): WorkflowNode[] {
  if (shiftX <= 0 || nodeIds.size === 0) {
    return nodes
  }

  return nodes.map((node) => {
    if (!nodeIds.has(node.id)) {
      return node
    }

    return {
      ...node,
      position: {
        ...node.position,
        x: node.position.x + shiftX,
      },
    }
  })
}

function resolveSubgraphShiftX(
  nodes: WorkflowNode[],
  subgraphNodeIds: Set<string>,
  insertPosition: XYPosition
): number {
  if (subgraphNodeIds.size === 0) {
    return 0
  }

  const staticNodes = nodes.filter((node) => !subgraphNodeIds.has(node.id))
  const movableNodes = nodes.filter((node) => subgraphNodeIds.has(node.id))
  const insertRect = createNodeRectAtPosition(insertPosition)
  const safetyMargin = 88
  let requiredShiftX = 0

  const fixedRects = [...staticNodes.map((node) => getNodeRect(node)), insertRect]
  const movableRects = movableNodes.map((node) => getNodeRect(node))

  for (const movableRect of movableRects) {
    for (const fixedRect of fixedRects) {
      const verticalOverlap = !(
        movableRect.bottom + safetyMargin < fixedRect.top ||
        movableRect.top - safetyMargin > fixedRect.bottom
      )
      if (!verticalOverlap) {
        continue
      }

      const shiftToRight = fixedRect.right + safetyMargin - movableRect.left
      if (shiftToRight > requiredShiftX) {
        requiredShiftX = shiftToRight
      }
    }
  }

  return Math.max(0, Math.ceil(requiredShiftX))
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

function getRemovedNodeIds(changes: NodeChange<WorkflowNode>[]): Set<string> {
  return new Set(changes.filter((change) => change.type === "remove").map((change) => change.id))
}

function filterEdgesForRemovedNodes(edges: WorkflowEdge[], removedNodeIds: Set<string>): WorkflowEdge[] {
  if (removedNodeIds.size === 0) {
    return edges
  }

  return edges.filter(
    (edge) => !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target)
  )
}

function hasEdgeCollectionChanged(previous: WorkflowEdge[], next: WorkflowEdge[]): boolean {
  if (previous === next) {
    return false
  }

  if (previous.length !== next.length) {
    return true
  }

  for (let index = 0; index < previous.length; index += 1) {
    if (previous[index] !== next[index]) {
      return true
    }
  }

  return false
}

function haveSameNodeIds(previous: WorkflowNode[], next: WorkflowNode[]): boolean {
  if (previous.length !== next.length) {
    return false
  }

  for (let index = 0; index < previous.length; index += 1) {
    if (previous[index]?.id !== next[index]?.id) {
      return false
    }
  }

  return true
}

function getRemovedEdgeIdSet(previous: WorkflowEdge[], next: WorkflowEdge[]): Set<string> {
  const nextEdgeIds = new Set(next.map((edge) => edge.id))
  return new Set(previous.filter((edge) => !nextEdgeIds.has(edge.id)).map((edge) => edge.id))
}

function getIncidentEdgeIdSet(edges: WorkflowEdge[], nodeIds: Set<string>): Set<string> {
  return new Set(
    edges
      .filter((edge) => nodeIds.has(edge.source) || nodeIds.has(edge.target))
      .map((edge) => edge.id)
  )
}

function areSetsEqual(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) {
    return false
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false
    }
  }

  return true
}

function shouldSquashPreviousEdgeRemovalWithNodeRemoval(
  history: ReturnType<typeof createHistoryState<WorkflowGraphState>>,
  removedNodeIds: Set<string>
): boolean {
  if (removedNodeIds.size === 0) {
    return false
  }

  const previousGraph = history.past[history.past.length - 1]
  if (!previousGraph) {
    return false
  }

  if (!haveSameNodeIds(previousGraph.nodes, history.present.nodes)) {
    return false
  }

  const removedEdgeIds = getRemovedEdgeIdSet(previousGraph.edges, history.present.edges)
  if (removedEdgeIds.size === 0) {
    return false
  }

  const incidentEdgeIds = getIncidentEdgeIdSet(previousGraph.edges, removedNodeIds)
  return areSetsEqual(removedEdgeIds, incidentEdgeIds)
}

export function createWorkflowStore(
  initialProps: WorkflowStoreInitialProps = {}
): StoreApi<WorkflowStoreState> {
  const initialGraph = cloneGraphState(initialProps.initialGraph ?? initialWorkflowGraph)

  return createStore<WorkflowStoreState>()((set, get) => ({
    history: createHistoryState(initialGraph),
    selectedNodeIds: [],
    quickAddPending: null,
    edgeInsertPending: null,
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
        edgeInsertPending: null,
      })
    },
    startEdgeInsertFromEdge: (edgeId) => {
      const currentGraph = get().history.present
      const edge = currentGraph.edges.find((candidate) => candidate.id === edgeId)
      if (!edge) {
        return
      }

      set({
        edgeInsertPending: { edgeId },
        quickAddPending: null,
      })
    },
    cancelQuickAdd: () => {
      if (!get().quickAddPending) {
        return
      }

      set({ quickAddPending: null })
    },
    cancelEdgeInsert: () => {
      if (!get().edgeInsertPending) {
        return
      }

      set({ edgeInsertPending: null })
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
    confirmEdgeInsertNode: (kind) => {
      const currentGraph = get().history.present
      const pending = get().edgeInsertPending
      if (!pending) {
        return
      }

      const edgeToSplit = currentGraph.edges.find((edge) => edge.id === pending.edgeId)
      if (!edgeToSplit) {
        set({
          edgeInsertPending: null,
          lastError: "Failed to resolve edge for insertion.",
        })
        return
      }

      const sourceNode = currentGraph.nodes.find((node) => node.id === edgeToSplit.source)
      const targetNode = currentGraph.nodes.find((node) => node.id === edgeToSplit.target)
      if (!sourceNode || !targetNode) {
        set({
          edgeInsertPending: null,
          lastError: "Failed to resolve edge nodes for insertion.",
        })
        return
      }

      const targetSubgraphIds = collectDescendantNodeIds(edgeToSplit.target, currentGraph.edges)
      const initialInsertPosition = getEdgeSplitInsertPosition(sourceNode, targetNode)
      const initialShiftX = resolveSubgraphShiftX(
        currentGraph.nodes,
        targetSubgraphIds,
        initialInsertPosition
      )
      const initiallyShiftedNodes = shiftNodesBySubgraph(
        currentGraph.nodes,
        targetSubgraphIds,
        initialShiftX
      )
      const shiftedSourceNode =
        initiallyShiftedNodes.find((node) => node.id === edgeToSplit.source) ?? sourceNode
      const shiftedTargetNode =
        initiallyShiftedNodes.find((node) => node.id === edgeToSplit.target) ?? targetNode
      const centeredInsertPosition = getEdgeSplitInsertPosition(shiftedSourceNode, shiftedTargetNode)
      const extraShiftX = resolveSubgraphShiftX(
        initiallyShiftedNodes,
        targetSubgraphIds,
        centeredInsertPosition
      )
      const finalShiftedNodes =
        extraShiftX > 0
          ? shiftNodesBySubgraph(initiallyShiftedNodes, targetSubgraphIds, extraShiftX)
          : initiallyShiftedNodes
      const finalSourceNode =
        finalShiftedNodes.find((node) => node.id === edgeToSplit.source) ?? shiftedSourceNode
      const finalTargetNode =
        finalShiftedNodes.find((node) => node.id === edgeToSplit.target) ?? shiftedTargetNode
      const insertPosition = getEdgeSplitInsertPosition(finalSourceNode, finalTargetNode)
      const shiftedNodes = finalShiftedNodes
      const nextNode = createWorkflowNode(kind, insertPosition)
      const nextNodes = [...shiftedNodes, nextNode]
      const nextEdgesBase = currentGraph.edges.filter((edge) => edge.id !== edgeToSplit.id)

      const sourceToInserted: ConnectionLike = {
        source: edgeToSplit.source,
        target: nextNode.id,
        sourceHandle: edgeToSplit.sourceHandle ?? null,
        targetHandle: null,
      }
      const insertedToTarget: ConnectionLike = {
        source: nextNode.id,
        target: edgeToSplit.target,
        sourceHandle: null,
        targetHandle: edgeToSplit.targetHandle ?? null,
      }

      const sourceToInsertedValidation = validateConnection(sourceToInserted, nextNodes, nextEdgesBase)
      const insertedToTargetValidation = validateConnection(insertedToTarget, nextNodes, nextEdgesBase)
      const canInsertBetween = sourceToInsertedValidation.valid && insertedToTargetValidation.valid

      if (canInsertBetween) {
        const sourceKinds = getKindsFromConnection(sourceToInserted, nextNodes)
        const targetKinds = getKindsFromConnection(insertedToTarget, nextNodes)
        if (!sourceKinds || !targetKinds) {
          set({
            edgeInsertPending: null,
            lastError: "Failed to resolve node kinds for edge insertion.",
          })
          return
        }

        const withSourceEdge = addEdge(
          {
            ...sourceToInserted,
            sourceHandle: sourceToInserted.sourceHandle ?? null,
            targetHandle: sourceToInserted.targetHandle ?? null,
            data: {
              sourceKind: sourceKinds.sourceKind,
              targetKind: sourceKinds.targetKind,
            },
          },
          nextEdgesBase
        ) as WorkflowEdge[]
        const withTwoEdges = addEdge(
          {
            ...insertedToTarget,
            sourceHandle: insertedToTarget.sourceHandle ?? null,
            targetHandle: insertedToTarget.targetHandle ?? null,
            data: {
              sourceKind: targetKinds.sourceKind,
              targetKind: targetKinds.targetKind,
            },
          },
          withSourceEdge
        ) as WorkflowEdge[]

        commitGraphState(set, {
          ...currentGraph,
          nodes: nextNodes,
          edges: withTwoEdges,
        })
        set({
          edgeInsertPending: null,
          selectedNodeIds: [nextNode.id],
          lastError: null,
        })
        return
      }

      const fallbackValidation = validateConnection(insertedToTarget, nextNodes, nextEdgesBase)
      if (!fallbackValidation.valid) {
        const message =
          sourceToInsertedValidation.reason ??
          insertedToTargetValidation.reason ??
          fallbackValidation.reason ??
          "Invalid edge insertion."
        set({
          edgeInsertPending: null,
          lastError: message,
        })
        return
      }

      const fallbackKinds = getKindsFromConnection(insertedToTarget, nextNodes)
      if (!fallbackKinds) {
        set({
          edgeInsertPending: null,
          lastError: "Failed to resolve node kinds for edge insertion fallback.",
        })
        return
      }

      const fallbackEdges = addEdge(
        {
          ...insertedToTarget,
          sourceHandle: insertedToTarget.sourceHandle ?? null,
          targetHandle: insertedToTarget.targetHandle ?? null,
          data: {
            sourceKind: fallbackKinds.sourceKind,
            targetKind: fallbackKinds.targetKind,
          },
        },
        nextEdgesBase
      ) as WorkflowEdge[]

      commitGraphState(set, {
        ...currentGraph,
        nodes: nextNodes,
        edges: fallbackEdges,
      })
      set({
        edgeInsertPending: null,
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

      if (targetNode.data.kind === "setVariable" && key === "variableName" && typeof rawValue === "string") {
        const previousNameValue = targetNode.data.config.variableName
        const previousName = typeof previousNameValue === "string" ? previousNameValue.trim() : ""
        const nextName = rawValue.trim()
        if (nextName === previousName) {
          return
        }

        if (!isValidJsIdentifier(nextName)) {
          set({ lastError: "Variable name must be a valid JavaScript identifier." })
          return
        }

        const duplicateVariable = currentGraph.nodes.some((node) => {
          if (node.id === nodeId || node.data.kind !== "setVariable") {
            return false
          }

          const variableNameValue = node.data.config.variableName
          if (typeof variableNameValue !== "string") {
            return false
          }

          return variableNameValue.trim() === nextName
        })

        if (duplicateVariable) {
          set({ lastError: "Variable name must be unique in this workflow." })
          return
        }

        const nextNodesWithNewName = currentGraph.nodes.map((node) => {
          if (node.id !== nodeId) {
            return node
          }

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
      const history = get().history
      const currentGraph = history.present
      const nextNodes = applyNodeChanges(changes, currentGraph.nodes)
      const removedNodeIds = getRemovedNodeIds(changes)
      const nextEdges = filterEdgesForRemovedNodes(currentGraph.edges, removedNodeIds)
      const selectedNodeIds = get().selectedNodeIds
      const remainingNodeIds = new Set(nextNodes.map((node) => node.id))
      const nextSelectedNodeIds = selectedNodeIds.filter((id) => remainingNodeIds.has(id))
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
      const edgeCollectionChanged = hasEdgeCollectionChanged(currentGraph.edges, nextEdges)

      if (!edgeCollectionChanged) {
        return
      }

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
