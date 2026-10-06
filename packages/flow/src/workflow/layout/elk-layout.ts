import ELK from "elkjs/lib/elk.bundled.js"

import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
} from "../node-registry/node-factory"
import type { NodeRegistry } from "../node-registry/registry"
import {
  EVALUATOR_FALSE_HANDLE,
  isBranchHandle,
  isBranchingKind,
} from "../types/branching"
import type {
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowNode,
} from "../types/types"
import {
  getElkPortId,
  resolveWorkflowLayoutPorts,
  type WorkflowLayoutPorts,
} from "./elk-ports"
import {
  WORKFLOW_ELK_PORT_CONSTRAINTS,
  workflowElkLayoutOptions,
} from "./elk-options"
import {
  applyBlockPositions,
  collectCollapsedBlocks,
  fitExpandedGroups,
  remapEdgesToBlocks,
  type ElkGroupBlock,
} from "./elk-groups"
import { getEstimatedNodeHeight } from "./node-size-estimate"

export interface ElkPort {
  id: string
  properties: {
    side: "WEST" | "EAST"
  }
}

export interface ElkNode {
  id: string
  width: number
  height: number
  layoutOptions?: Record<string, string>
  ports?: ElkPort[]
}

export interface ElkEdge {
  id: string
  sources: string[]
  targets: string[]
}

export interface ElkGraph {
  id: string
  layoutOptions: Record<string, string>
  children: ElkNode[]
  edges: ElkEdge[]
}

export interface ElkLayoutNode extends ElkNode {
  x?: number
  y?: number
}

export interface ElkLayoutGraph {
  children?: ElkLayoutNode[]
}

export interface ElkLayoutEngine {
  layout: (graph: ElkGraph) => Promise<ElkLayoutGraph>
}

export const defaultElkLayoutEngine: ElkLayoutEngine = new ELK()
const EVALUATOR_SHORTCUT_CLEARANCE = 80
const EVALUATOR_TRUE_HANDLE_RATIO = 0.34
const EVALUATOR_FALSE_HANDLE_RATIO = 0.72

function getNodeWidth(node: WorkflowNode): number {
  return node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH
}

function getNodeHeight(node: WorkflowNode): number {
  if (node.measured?.height != null) {
    return node.measured.height
  }

  return Math.max(
    node.height ?? DEFAULT_NODE_HEIGHT,
    getEstimatedNodeHeight(node)
  )
}

function toElkPorts(node: WorkflowNode, ports: WorkflowLayoutPorts): ElkPort[] {
  const elkPorts: ElkPort[] = []

  if (ports.hasTargetPort) {
    elkPorts.push({
      id: getElkPortId(node.id, "target", null),
      properties: { side: "WEST" },
    })
  }

  ports.outputHandles.forEach((handle) => {
    elkPorts.push({
      id: getElkPortId(node.id, "source", handle.id),
      properties: { side: "EAST" },
    })
  })

  return elkPorts
}

function toElkBlock(block: ElkGroupBlock): ElkNode {
  return {
    id: block.id,
    width: block.width,
    height: block.height,
    layoutOptions: {
      "org.eclipse.elk.portConstraints": WORKFLOW_ELK_PORT_CONSTRAINTS,
    },
    ports: [
      {
        id: getElkPortId(block.id, "target", null),
        properties: { side: "WEST" },
      },
      {
        id: getElkPortId(block.id, "source", null),
        properties: { side: "EAST" },
      },
    ],
  }
}

/**
 * Builds the ELK graph for `nodes` and `edges`. A collapsed group is passed as
 * a block in `blocks` (its members left out of `nodes`): one node with a
 * single input and output port, which `edges` may target by the block id.
 */
export function buildElkGraph(
  registry: NodeRegistry,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  blocks: readonly ElkGroupBlock[] = []
): ElkGraph {
  const nodePorts = new Map<string, WorkflowLayoutPorts>()
  const blockIds = new Set(blocks.map((block) => block.id))

  const children = nodes.map((node) => {
    const ports = resolveWorkflowLayoutPorts(registry, node)
    nodePorts.set(node.id, ports)

    return {
      id: node.id,
      width: getNodeWidth(node),
      height: getNodeHeight(node),
      layoutOptions: {
        "org.eclipse.elk.portConstraints": WORKFLOW_ELK_PORT_CONSTRAINTS,
      },
      ports: toElkPorts(node, ports),
    }
  })

  const elkEdges = edges.map((edge) => {
    const sourcePorts = nodePorts.get(edge.source)
    const targetPorts = nodePorts.get(edge.target)
    const isSourceBlock = blockIds.has(edge.source)
    const isTargetBlock = blockIds.has(edge.target)

    const sourceHandleId = isSourceBlock ? null : (edge.sourceHandle ?? null)
    const targetHandleId = isTargetBlock ? null : (edge.targetHandle ?? null)

    const sourcePortId = getElkPortId(edge.source, "source", sourceHandleId)
    const targetPortId = getElkPortId(edge.target, "target", targetHandleId)

    if (
      !isSourceBlock &&
      (!sourcePorts ||
        !sourcePorts.outputHandles.some(
          (handle) => handle.id === sourceHandleId
        ))
    ) {
      throw new Error(`Missing ELK source port for edge ${edge.id}`)
    }

    if (!isTargetBlock && (!targetPorts || !targetPorts.hasTargetPort)) {
      throw new Error(`Missing ELK target port for edge ${edge.id}`)
    }

    return {
      id: edge.id,
      sources: [sourcePortId],
      targets: [targetPortId],
    }
  })

  return {
    id: "workflow-root",
    layoutOptions: { ...workflowElkLayoutOptions },
    children: [...children, ...blocks.map(toElkBlock)],
    edges: elkEdges,
  }
}

export function applyElkLayout(
  nodes: WorkflowNode[],
  layoutedGraph: ElkLayoutGraph
): WorkflowNode[] {
  const positionsById = new Map(
    (layoutedGraph.children ?? []).map(
      (node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }] as const
    )
  )

  let didChange = false
  const nextNodes = nodes.map((node) => {
    const nextPosition = positionsById.get(node.id)
    if (!nextPosition) {
      return node
    }

    if (
      node.position.x === nextPosition.x &&
      node.position.y === nextPosition.y
    ) {
      return node
    }

    didChange = true
    return {
      ...node,
      position: nextPosition,
    }
  })

  return didChange ? nextNodes : nodes
}

function getNodeBottom(node: WorkflowNode): number {
  return node.position.y + getNodeHeight(node)
}

function getEvaluatorHandleY(node: WorkflowNode, handleId: string): number {
  const ratio =
    handleId === EVALUATOR_FALSE_HANDLE
      ? EVALUATOR_FALSE_HANDLE_RATIO
      : EVALUATOR_TRUE_HANDLE_RATIO

  return node.position.y + getNodeHeight(node) * ratio
}

function collectPathNodeIds(
  startNodeId: string,
  targetNodeId: string,
  edges: WorkflowEdge[],
  excludedEdgeId: string
): Set<string> {
  const outgoingBySource = new Map<string, WorkflowEdge[]>()
  edges.forEach((edge) => {
    if (edge.id === excludedEdgeId) {
      return
    }

    const outgoing = outgoingBySource.get(edge.source) ?? []
    outgoing.push(edge)
    outgoingBySource.set(edge.source, outgoing)
  })

  const pathNodeIds = new Set<string>()
  const visited = new Set<string>()

  function visit(nodeId: string): boolean {
    if (nodeId === targetNodeId) {
      return true
    }

    if (visited.has(nodeId)) {
      return false
    }

    visited.add(nodeId)

    let reachesTarget = false
    for (const edge of outgoingBySource.get(nodeId) ?? []) {
      if (visit(edge.target)) {
        reachesTarget = true
      }
    }

    if (reachesTarget) {
      pathNodeIds.add(nodeId)
    }

    return reachesTarget
  }

  visit(startNodeId)
  return pathNodeIds
}

function isEvaluatorShortcutToResult(
  edge: WorkflowEdge,
  nodesById: Map<string, WorkflowNode>
): boolean {
  const source = nodesById.get(edge.source)
  const target = nodesById.get(edge.target)

  return (
    isBranchingKind(source?.data.kind) &&
    target?.data.kind === "result" &&
    isBranchHandle(edge.sourceHandle)
  )
}

export function applyEvaluatorShortcutClearance(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const outgoingBySource = new Map<string, WorkflowEdge[]>()
  const adjustedYById = new Map<string, number>()

  edges.forEach((edge) => {
    const outgoing = outgoingBySource.get(edge.source) ?? []
    outgoing.push(edge)
    outgoingBySource.set(edge.source, outgoing)
  })

  const targetYById = new Map<string, number>()

  edges.forEach((shortcutEdge) => {
    if (!isEvaluatorShortcutToResult(shortcutEdge, nodesById)) {
      return
    }

    const target = nodesById.get(shortcutEdge.target)
    const source = nodesById.get(shortcutEdge.source)
    const outgoing = outgoingBySource.get(shortcutEdge.source) ?? []
    if (!target || !source || outgoing.length < 2) {
      return
    }

    const siblingPathNodeIds = new Set<string>()
    outgoing.forEach((siblingEdge) => {
      // Only the opposite branch runs alongside the shortcut. A fan-out kind
      // can put several edges on the shortcut's own branch; those share its
      // lane and need no clearance from it.
      if (
        siblingEdge.id === shortcutEdge.id ||
        siblingEdge.sourceHandle === shortcutEdge.sourceHandle
      ) {
        return
      }

      collectPathNodeIds(
        siblingEdge.target,
        shortcutEdge.target,
        edges,
        shortcutEdge.id
      ).forEach((nodeId) => {
        siblingPathNodeIds.add(nodeId)
      })
    })

    const siblingPathNodes = Array.from(siblingPathNodeIds)
      .map((nodeId) => nodesById.get(nodeId))
      .filter((node): node is WorkflowNode => node != null)

    if (siblingPathNodes.length === 0) {
      return
    }

    const shortcutHandle = shortcutEdge.sourceHandle
    if (!isBranchHandle(shortcutHandle)) {
      return
    }

    const sourceLaneY = getEvaluatorHandleY(source, shortcutHandle)

    if (shortcutHandle === EVALUATOR_FALSE_HANDLE) {
      const maximumSiblingBottom = sourceLaneY - EVALUATOR_SHORTCUT_CLEARANCE
      siblingPathNodes.forEach((node) => {
        const maximumNodeY = maximumSiblingBottom - getNodeHeight(node)
        adjustedYById.set(
          node.id,
          Math.min(adjustedYById.get(node.id) ?? node.position.y, maximumNodeY)
        )
      })

      const minimumTargetY =
        Math.max(
          sourceLaneY + EVALUATOR_SHORTCUT_CLEARANCE,
          ...siblingPathNodes.map(getNodeBottom)
        ) + EVALUATOR_SHORTCUT_CLEARANCE
      targetYById.set(
        target.id,
        Math.max(
          targetYById.get(target.id) ?? target.position.y,
          minimumTargetY
        )
      )
      return
    }

    const minimumSiblingTop = sourceLaneY + EVALUATOR_SHORTCUT_CLEARANCE
    siblingPathNodes.forEach((node) => {
      adjustedYById.set(
        node.id,
        Math.max(
          adjustedYById.get(node.id) ?? node.position.y,
          minimumSiblingTop
        )
      )
    })

    const maximumTargetY =
      Math.min(
        sourceLaneY - EVALUATOR_SHORTCUT_CLEARANCE,
        ...siblingPathNodes.map((node) => node.position.y)
      ) -
      getNodeHeight(target) -
      EVALUATOR_SHORTCUT_CLEARANCE
    targetYById.set(
      target.id,
      Math.min(targetYById.get(target.id) ?? target.position.y, maximumTargetY)
    )
  })

  if (targetYById.size === 0 && adjustedYById.size === 0) {
    return nodes
  }

  let didChange = false
  const nextNodes = nodes.map((node) => {
    const targetY = targetYById.get(node.id) ?? adjustedYById.get(node.id)
    if (targetY == null || node.position.y === targetY) {
      return node
    }

    didChange = true
    return {
      ...node,
      position: {
        ...node.position,
        y: targetY,
      },
    }
  })

  return didChange ? nextNodes : nodes
}

/**
 * Lays the workflow out with ELK. Each collapsed group is one block the size
 * of its card, and its hidden members move with it; afterwards every
 * non-empty expanded group is fitted around its members.
 */
export async function computeWorkflowAutoLayout(
  registry: NodeRegistry,
  graph: WorkflowGraphState,
  engine?: ElkLayoutEngine
): Promise<WorkflowGraphState> {
  const blocks = collectCollapsedBlocks(graph)
  const hiddenIds = new Set(blocks.flatMap((block) => [...block.memberIds]))
  const layoutNodes =
    hiddenIds.size === 0
      ? graph.nodes
      : graph.nodes.filter((node) => !hiddenIds.has(node.id))
  const elkGraph = buildElkGraph(
    registry,
    layoutNodes,
    remapEdgesToBlocks(graph.edges, blocks),
    blocks
  )
  const layoutEngine = engine ?? defaultElkLayoutEngine
  const layoutedGraph = await layoutEngine.layout(elkGraph)

  // Hidden members keep their place inside the block, so the clearance pass
  // only sees the nodes the layout placed.
  const visibleEdges =
    hiddenIds.size === 0
      ? graph.edges
      : graph.edges.filter(
          (edge) => !hiddenIds.has(edge.source) && !hiddenIds.has(edge.target)
        )
  const laidOut: WorkflowGraphState = {
    ...graph,
    nodes: applyEvaluatorShortcutClearance(
      applyElkLayout(graph.nodes, layoutedGraph),
      visibleEdges
    ),
  }
  const withBlocks = applyBlockPositions(
    laidOut,
    blocks,
    new Map(
      (layoutedGraph.children ?? []).map((child) => [
        child.id,
        { x: child.x ?? 0, y: child.y ?? 0 },
      ])
    )
  )

  return {
    ...withBlocks,
    groups: fitExpandedGroups(withBlocks.nodes, withBlocks.groups),
  }
}
