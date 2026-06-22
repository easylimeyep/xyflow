import type { Viewport } from "@xyflow/react"

import { DEFAULT_VIEWPORT } from "../default-graph"
import { computeWorkflowAutoLayout } from "../layout"
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
  return normalizeInitialGraphInput(input)
}

export async function createInitialGraphElk(
  input: InitialGraphInput
): Promise<WorkflowGraphState> {
  const graph = normalizeInitialGraphInput(input)

  // Initial graph positioning always uses the shared ELK workflow layout path.
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
