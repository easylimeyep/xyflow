import type { Viewport } from "@xyflow/react"

import { DEFAULT_VIEWPORT } from "../default-graph"
import { computeWorkflowAutoLayout } from "../layout"
import { resolveWorkflowLayoutPorts } from "../layout/elk-ports"
import {
  createWorkflowNode,
  getNodeDefinition,
  normalizeNodeConfig,
} from "../node-registry"
import type {
  NodeConfigByKind,
  NodeKind,
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowNode,
} from "../types"
import { getKindsFromConnection, validateConnection } from "../validation"

const INITIAL_GRAPH_DEFAULT_DOCUMENT = {
  id: "workflow-initial",
  name: "Untitled Workflow",
  version: 1,
  metadata: {},
} as const satisfies WorkflowGraphState["document"]

const LINEAR_LAYOUT_START_X = 0
const LINEAR_LAYOUT_START_Y = 80
const LINEAR_LAYOUT_COLUMN_GAP = 320
const LINEAR_LAYOUT_ROW_GAP = 140

type InputNodeByKind = {
  [K in NodeKind]: {
    id: string
    kind: K
    label?: string
    config?: Partial<NodeConfigByKind[K]>
  }
}

export type InitialGraphNodeInput = InputNodeByKind[NodeKind]

export interface InitialGraphEdgeInput {
  id?: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

export type InitialGraphDocumentInput = Partial<WorkflowGraphState["document"]>
export type InitialGraphViewportInput = Partial<Viewport>

export interface InitialGraphInput {
  nodes: readonly InitialGraphNodeInput[]
  edges?: readonly InitialGraphEdgeInput[]
  document?: InitialGraphDocumentInput
  viewport?: InitialGraphViewportInput
}

export function createInitialGraph(input: InitialGraphInput): WorkflowGraphState {
  const graph = normalizeInitialGraphInput(input)

  return applyDeterministicLinearLayout(graph)
}

export async function createInitialGraphElk(
  input: InitialGraphInput
): Promise<WorkflowGraphState> {
  const graph = normalizeInitialGraphInput(input)

  return computeWorkflowAutoLayout(graph)
}

function normalizeInitialGraphInput(input: InitialGraphInput): WorkflowGraphState {
  const nodes = normalizeNodes(input.nodes)
  const edges = normalizeEdges(nodes, input.edges ?? [])

  return {
    nodes,
    edges,
    viewport: normalizeViewport(input.viewport),
    document: normalizeDocument(input.document),
  }
}

function normalizeNodes(inputs: readonly InitialGraphNodeInput[]): WorkflowNode[] {
  const seenIds = new Set<string>()

  return inputs.map((input) => {
    if (seenIds.has(input.id)) {
      throw new Error(`Duplicate initial graph node id: ${input.id}`)
    }

    seenIds.add(input.id)

    const definition = getNodeDefinition(input.kind)
    const label = input.label ?? definition.title
    const node = createWorkflowNode(input.kind, { x: 0, y: 0 }, label)

    return {
      ...node,
      id: input.id,
      data: {
        kind: input.kind,
        label,
        config: normalizeNodeConfig(
          input.kind,
          (input.config ?? {}) as Record<string, unknown>
        ),
      },
    }
  })
}

function normalizeEdges(
  nodes: WorkflowNode[],
  inputs: readonly InitialGraphEdgeInput[]
): WorkflowEdge[] {
  const nextEdges: WorkflowEdge[] = []

  inputs.forEach((input, index) => {
    const connection = {
      source: input.source,
      target: input.target,
      sourceHandle: input.sourceHandle ?? null,
      targetHandle: input.targetHandle ?? null,
    }

    const result = validateConnection(connection, nodes, nextEdges)
    if (!result.valid) {
      throw new Error(
        `Invalid initial graph edge ${describeEdge(input, index)}: ${result.reason}`
      )
    }

    const kinds = getKindsFromConnection(connection, nodes)
    if (!kinds) {
      throw new Error(
        `Invalid initial graph edge ${describeEdge(input, index)}: missing node kinds.`
      )
    }

    nextEdges.push({
      id: input.id ?? createInitialGraphEdgeId(input, index),
      source: input.source,
      target: input.target,
      sourceHandle: input.sourceHandle ?? null,
      targetHandle: input.targetHandle ?? null,
      data: {
        sourceKind: kinds.sourceKind,
        targetKind: kinds.targetKind,
      },
    })
  })

  return nextEdges
}

function createInitialGraphEdgeId(
  input: InitialGraphEdgeInput,
  index: number
): string {
  const sourceHandle = input.sourceHandle ?? "default"
  const targetHandle = input.targetHandle ?? "default"

  return `initial-edge-${index + 1}-${input.source}-${sourceHandle}-${input.target}-${targetHandle}`
}

function describeEdge(input: InitialGraphEdgeInput, index: number): string {
  return input.id ?? `${input.source}:${input.sourceHandle ?? "default"}->${input.target}:${input.targetHandle ?? "default"} (#${index + 1})`
}

function normalizeViewport(input: InitialGraphViewportInput | undefined): Viewport {
  return {
    ...DEFAULT_VIEWPORT,
    ...input,
  }
}

function normalizeDocument(
  input: InitialGraphDocumentInput | undefined
): WorkflowGraphState["document"] {
  return {
    ...INITIAL_GRAPH_DEFAULT_DOCUMENT,
    ...input,
    metadata: {
      ...INITIAL_GRAPH_DEFAULT_DOCUMENT.metadata,
      ...(input?.metadata ?? {}),
    },
  }
}

function applyDeterministicLinearLayout(
  graph: WorkflowGraphState
): WorkflowGraphState {
  if (graph.nodes.length === 0) {
    return graph
  }

  const inputOrder = new Map(graph.nodes.map((node, index) => [node.id, index]))
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]))
  const incoming = new Map<string, WorkflowEdge[]>()
  const outgoing = new Map<string, WorkflowEdge[]>()
  const indegree = new Map(graph.nodes.map((node) => [node.id, 0]))

  graph.edges.forEach((edge) => {
    const nextIncoming = incoming.get(edge.target) ?? []
    nextIncoming.push(edge)
    incoming.set(edge.target, nextIncoming)

    const nextOutgoing = outgoing.get(edge.source) ?? []
    nextOutgoing.push(edge)
    outgoing.set(edge.source, nextOutgoing)

    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1)
  })

  const ready = graph.nodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort((left, right) => compareInputOrder(left.id, right.id, inputOrder))

  const layers = new Map<string, number>()
  const topoOrder: string[] = []

  while (ready.length > 0) {
    const node = ready.shift()
    if (!node) {
      continue
    }

    topoOrder.push(node.id)
    const parentEdges = incoming.get(node.id) ?? []
    const nextLayer =
      parentEdges.length === 0
        ? 0
        : Math.max(
            ...parentEdges.map((edge) => (layers.get(edge.source) ?? 0) + 1)
          )
    layers.set(node.id, nextLayer)

    for (const edge of outgoing.get(node.id) ?? []) {
      const remaining = (indegree.get(edge.target) ?? 0) - 1
      indegree.set(edge.target, remaining)
      if (remaining === 0) {
        const nextNode = nodesById.get(edge.target)
        if (nextNode) {
          ready.push(nextNode)
          ready.sort((left, right) =>
            compareInputOrder(left.id, right.id, inputOrder)
          )
        }
      }
    }
  }

  if (topoOrder.length !== graph.nodes.length) {
    throw new Error("Initial graph must be acyclic for linear layout.")
  }

  const handleOrderByNode = new Map<string, Map<string | null, number>>(
    graph.nodes.map((node) => {
      const order = new Map<string | null, number>()
      resolveWorkflowLayoutPorts(node).outputHandles.forEach((handle, index) => {
        order.set(handle.id ?? null, index)
      })
      if (!order.has(null)) {
        order.set(null, 0)
      }
      return [node.id, order]
    })
  )

  const nodesByLayer = new Map<number, WorkflowNode[]>()
  graph.nodes.forEach((node) => {
    const layer = layers.get(node.id) ?? 0
    const current = nodesByLayer.get(layer) ?? []
    current.push(node)
    nodesByLayer.set(layer, current)
  })

  const assignedRanks = new Map<string, number>()
  const positionedNodes: WorkflowNode[] = []
  const layerIndexes = Array.from(nodesByLayer.keys()).sort((left, right) => left - right)

  layerIndexes.forEach((layerIndex) => {
    const layerNodes = nodesByLayer.get(layerIndex) ?? []
    layerNodes.sort((left, right) =>
      compareLayerNodes(left, right, {
        inputOrder,
        incoming,
        assignedRanks,
        handleOrderByNode,
      })
    )

    layerNodes.forEach((node, rowIndex) => {
      assignedRanks.set(node.id, rowIndex)
      positionedNodes.push({
        ...node,
        position: {
          x: LINEAR_LAYOUT_START_X + layerIndex * LINEAR_LAYOUT_COLUMN_GAP,
          y: LINEAR_LAYOUT_START_Y + rowIndex * LINEAR_LAYOUT_ROW_GAP,
        },
      })
    })
  })

  const positionedById = new Map(positionedNodes.map((node) => [node.id, node]))

  return {
    ...graph,
    nodes: graph.nodes.map((node) => positionedById.get(node.id) ?? node),
  }
}

function compareLayerNodes(
  left: WorkflowNode,
  right: WorkflowNode,
  context: {
    inputOrder: Map<string, number>
    incoming: Map<string, WorkflowEdge[]>
    assignedRanks: Map<string, number>
    handleOrderByNode: Map<string, Map<string | null, number>>
  }
): number {
  const leftScore = getLayerSortScore(left.id, context)
  const rightScore = getLayerSortScore(right.id, context)

  return (
    leftScore.anchor - rightScore.anchor ||
    leftScore.handle - rightScore.handle ||
    leftScore.order - rightScore.order
  )
}

function getLayerSortScore(
  nodeId: string,
  context: {
    inputOrder: Map<string, number>
    incoming: Map<string, WorkflowEdge[]>
    assignedRanks: Map<string, number>
    handleOrderByNode: Map<string, Map<string | null, number>>
  }
): { anchor: number; handle: number; order: number } {
  const order = context.inputOrder.get(nodeId) ?? Number.MAX_SAFE_INTEGER
  const incomingEdges = context.incoming.get(nodeId) ?? []

  if (incomingEdges.length === 0) {
    return { anchor: order, handle: 0, order }
  }

  const weightedAnchors = incomingEdges.map((edge) => {
    const sourceRank = context.assignedRanks.get(edge.source) ?? 0
    const handleOrder =
      context.handleOrderByNode.get(edge.source)?.get(edge.sourceHandle ?? null) ?? 0

    return {
      anchor: sourceRank * 100 + handleOrder,
      handle: handleOrder,
    }
  })

  const anchor =
    weightedAnchors.reduce((sum, entry) => sum + entry.anchor, 0) /
    weightedAnchors.length
  const handle = Math.min(...weightedAnchors.map((entry) => entry.handle))

  return { anchor, handle, order }
}

function compareInputOrder(
  leftId: string,
  rightId: string,
  inputOrder: Map<string, number>
): number {
  return (inputOrder.get(leftId) ?? 0) - (inputOrder.get(rightId) ?? 0)
}
