import type { Viewport } from "@xyflow/react"

import { DEFAULT_VIEWPORT } from "../default-graph"
import { computeWorkflowAutoLayout } from "../layout"
import {
  createNodeRegistry,
  createWorkflowNode,
  normalizeNodeConfig,
} from "../node-registry"
import type {
  BuiltinNodeKind,
  NodeDefinition,
  NodeRegistry,
} from "../node-registry"
import { fitToContents, getGroupMembers } from "../groups/group-geometry"
import {
  DEFAULT_WORKFLOW_GROUP_COLOR,
  type NodeConfigByKind,
  type NodeKind,
  type WorkflowEdge,
  type WorkflowGraphState,
  type WorkflowGroup,
  type WorkflowGroupColor,
  type WorkflowNode,
} from "../types"
import { getKindsFromConnection, validateConnection } from "../validation"

const INITIAL_GRAPH_DEFAULT_DOCUMENT = {
  id: "workflow-initial",
  name: "Untitled Workflow",
  version: 1,
  metadata: {},
} as const satisfies WorkflowGraphState["document"]

/**
 * A built-in kind types its `config` against that kind's config shape; a kind
 * registered by a consumer is not in `NodeConfigByKind`, so its config is
 * checked at runtime by `normalizeNodeConfig` instead.
 */
type BuiltinNodeInput = {
  [K in BuiltinNodeKind]: {
    id: string
    kind: K
    label?: string
    config?: Partial<NodeConfigByKind[K]>
  }
}[BuiltinNodeKind]

interface RegisteredNodeInput {
  id: string
  kind: NodeKind
  label?: string
  config?: Record<string, unknown>
}

export type InitialGraphNodeInput = BuiltinNodeInput | RegisteredNodeInput

export interface InitialGraphEdgeInput {
  id?: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

export type InitialGraphDocumentInput = Partial<WorkflowGraphState["document"]>
export type InitialGraphViewportInput = Partial<Viewport>

/**
 * A group of nodes in the starting graph. Its frame is fitted around its
 * members once they have positions; `createInitialGraphElk` lays the members
 * out first.
 */
export interface InitialGraphGroupInput {
  id: string
  /** Defaults to `Group N`. */
  label?: string
  color?: WorkflowGroupColor
  /** Members; a node may belong to one group only. May be empty. */
  nodeIds: readonly string[]
  collapsed?: boolean
}

export interface InitialGraphInput {
  nodes: readonly InitialGraphNodeInput[]
  edges?: readonly InitialGraphEdgeInput[]
  groups?: readonly InitialGraphGroupInput[]
  document?: InitialGraphDocumentInput
  viewport?: InitialGraphViewportInput
}

export function createInitialGraph(
  definitions: readonly NodeDefinition[],
  input: InitialGraphInput
): WorkflowGraphState {
  return normalizeInitialGraphInput(createNodeRegistry(definitions), input)
}

export async function createInitialGraphElk(
  definitions: readonly NodeDefinition[],
  input: InitialGraphInput
): Promise<WorkflowGraphState> {
  const registry = createNodeRegistry(definitions)
  const graph = normalizeInitialGraphInput(registry, input)

  // Initial graph positioning always uses the shared ELK workflow layout path.
  if (!graph.groups.some((group) => group.collapsed)) {
    return computeWorkflowAutoLayout(registry, graph)
  }

  // Twice when a group starts collapsed: first with every group expanded, so
  // its members get a real arrangement (and their frame a fitted size), then
  // as the canvas shows it, the collapsed group one card-sized block that
  // carries its members along.
  const expanded = await computeWorkflowAutoLayout(registry, {
    ...graph,
    groups: graph.groups.map((group) => ({ ...group, collapsed: false })),
  })
  return computeWorkflowAutoLayout(registry, {
    ...expanded,
    groups: expanded.groups.map((group, index) => ({
      ...group,
      collapsed: graph.groups[index]?.collapsed ?? false,
    })),
  })
}

function normalizeInitialGraphInput(
  registry: NodeRegistry,
  input: InitialGraphInput
): WorkflowGraphState {
  const { nodes, groups } = normalizeGroups(
    normalizeNodes(registry, input.nodes),
    input.groups ?? []
  )
  const edges = normalizeEdges(registry, nodes, input.edges ?? [])

  return {
    nodes,
    edges,
    groups,
    viewport: normalizeViewport(input.viewport),
    document: normalizeDocument(input.document),
  }
}

function normalizeNodes(
  registry: NodeRegistry,
  inputs: readonly InitialGraphNodeInput[]
): WorkflowNode[] {
  const seenIds = new Set<string>()

  return inputs.map((input) => {
    if (seenIds.has(input.id)) {
      throw new Error(`Duplicate initial graph node id: ${input.id}`)
    }

    seenIds.add(input.id)

    const definition = registry.get(input.kind)
    if (!definition) {
      throw new Error(`Unknown node kind: ${input.kind}`)
    }
    const label = input.label ?? definition.title
    const node = createWorkflowNode(registry, input.kind, { x: 0, y: 0 }, label)

    return {
      ...node,
      id: input.id,
      data: {
        kind: input.kind,
        label,
        config: normalizeNodeConfig(
          registry,
          input.kind,
          (input.config ?? {}) as Record<string, unknown>
        ),
      },
    }
  })
}

/** Default size of an empty group's frame. */
const EMPTY_GROUP_WIDTH = 320
const EMPTY_GROUP_HEIGHT = 200

function normalizeGroups(
  nodes: WorkflowNode[],
  inputs: readonly InitialGraphGroupInput[]
): { nodes: WorkflowNode[]; groups: WorkflowGroup[] } {
  if (inputs.length === 0) {
    return { nodes, groups: [] }
  }

  const nodeIds = new Set(nodes.map((node) => node.id))
  const groupIds = new Set<string>()
  const groupIdByNodeId = new Map<string, string>()
  inputs.forEach((input) => {
    if (groupIds.has(input.id)) {
      throw new Error(`Duplicate initial graph group id: ${input.id}`)
    }
    groupIds.add(input.id)
    input.nodeIds.forEach((nodeId) => {
      if (!nodeIds.has(nodeId)) {
        throw new Error(
          `Initial graph group ${input.id} references unknown node: ${nodeId}`
        )
      }
      if (groupIdByNodeId.has(nodeId)) {
        throw new Error(
          `Initial graph node ${nodeId} belongs to more than one group.`
        )
      }
      groupIdByNodeId.set(nodeId, input.id)
    })
  })

  const groupedNodes = nodes.map((node) => {
    const groupId = groupIdByNodeId.get(node.id)
    return groupId ? { ...node, data: { ...node.data, groupId } } : node
  })
  const groups = inputs.map((input, index) =>
    fitToContents(
      {
        id: input.id,
        label: input.label ?? `Group ${index + 1}`,
        color: input.color ?? DEFAULT_WORKFLOW_GROUP_COLOR,
        x: 0,
        y: 0,
        width: EMPTY_GROUP_WIDTH,
        height: EMPTY_GROUP_HEIGHT,
        collapsed: input.collapsed ?? false,
      },
      getGroupMembers(input.id, groupedNodes)
    )
  )

  return { nodes: groupedNodes, groups }
}

function normalizeEdges(
  registry: NodeRegistry,
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

    const result = validateConnection(registry, connection, nodes, nextEdges)
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
  return (
    input.id ??
    `${input.source}:${input.sourceHandle ?? "default"}->${input.target}:${input.targetHandle ?? "default"} (#${index + 1})`
  )
}

function normalizeViewport(
  input: InitialGraphViewportInput | undefined
): Viewport {
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
