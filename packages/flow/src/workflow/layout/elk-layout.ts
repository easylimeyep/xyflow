import ELK from "elkjs/lib/elk.bundled.js"

import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
} from "../node-registry/node-factory"
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

const EXTRACTOR_LAYOUT_HEIGHT = 195
const COMPACT_CONFIG_NODE_LAYOUT_HEIGHT = 116
const BRANCH_LAYOUT_BASE_HEIGHT = 116
const BRANCH_LAYOUT_CONDITION_HEIGHT = 56

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

const defaultElkLayoutEngine: ElkLayoutEngine = new ELK()
const BRANCH_SHORTCUT_CLEARANCE = 80
const BRANCH_TRUE_HANDLE_RATIO = 0.34
const BRANCH_FALSE_HANDLE_RATIO = 0.72

function getEstimatedNodeHeight(node: WorkflowNode): number {
  switch (node.data.kind) {
    case "extractor":
      return EXTRACTOR_LAYOUT_HEIGHT
    case "setVariable":
    case "inlineExpression":
    case "result":
      return COMPACT_CONFIG_NODE_LAYOUT_HEIGHT
    case "branch": {
      const conditionCount = Array.isArray(node.data.config.conditions)
        ? Math.max(1, node.data.config.conditions.length)
        : 1

      return (
        BRANCH_LAYOUT_BASE_HEIGHT +
        conditionCount * BRANCH_LAYOUT_CONDITION_HEIGHT
      )
    }
    default:
      return DEFAULT_NODE_HEIGHT
  }
}

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

export function buildElkGraph(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ElkGraph {
  const nodePorts = new Map<string, WorkflowLayoutPorts>()

  const children = nodes.map((node) => {
    const ports = resolveWorkflowLayoutPorts(node)
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

    const sourceHandleId = edge.sourceHandle ?? null
    const targetHandleId = edge.targetHandle ?? null

    const sourcePortId = getElkPortId(edge.source, "source", sourceHandleId)
    const targetPortId = getElkPortId(edge.target, "target", targetHandleId)

    if (
      !sourcePorts ||
      !sourcePorts.outputHandles.some((handle) => handle.id === sourceHandleId)
    ) {
      throw new Error(`Missing ELK source port for edge ${edge.id}`)
    }

    if (!targetPorts || !targetPorts.hasTargetPort) {
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
    children,
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

function getBranchHandleY(node: WorkflowNode, handleId: string): number {
  const ratio =
    handleId === "branch-false"
      ? BRANCH_FALSE_HANDLE_RATIO
      : BRANCH_TRUE_HANDLE_RATIO

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

function isBranchShortcutToResult(
  edge: WorkflowEdge,
  nodesById: Map<string, WorkflowNode>
): boolean {
  const source = nodesById.get(edge.source)
  const target = nodesById.get(edge.target)

  return (
    source?.data.kind === "branch" &&
    target?.data.kind === "result" &&
    (edge.sourceHandle === "branch-true" ||
      edge.sourceHandle === "branch-false")
  )
}

export function applyBranchShortcutClearance(
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
    if (!isBranchShortcutToResult(shortcutEdge, nodesById)) {
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
      if (siblingEdge.id === shortcutEdge.id) {
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
    if (shortcutHandle !== "branch-true" && shortcutHandle !== "branch-false") {
      return
    }

    const sourceLaneY = getBranchHandleY(source, shortcutHandle)

    if (shortcutHandle === "branch-false") {
      const maximumSiblingBottom = sourceLaneY - BRANCH_SHORTCUT_CLEARANCE
      siblingPathNodes.forEach((node) => {
        const maximumNodeY = maximumSiblingBottom - getNodeHeight(node)
        adjustedYById.set(
          node.id,
          Math.min(adjustedYById.get(node.id) ?? node.position.y, maximumNodeY)
        )
      })

      const minimumTargetY = Math.max(
        sourceLaneY + BRANCH_SHORTCUT_CLEARANCE,
        ...siblingPathNodes.map(getNodeBottom)
      ) + BRANCH_SHORTCUT_CLEARANCE
      targetYById.set(
        target.id,
        Math.max(targetYById.get(target.id) ?? target.position.y, minimumTargetY)
      )
      return
    }

    const minimumSiblingTop = sourceLaneY + BRANCH_SHORTCUT_CLEARANCE
    siblingPathNodes.forEach((node) => {
      adjustedYById.set(
        node.id,
        Math.max(adjustedYById.get(node.id) ?? node.position.y, minimumSiblingTop)
      )
    })

    const maximumTargetY =
      Math.min(sourceLaneY - BRANCH_SHORTCUT_CLEARANCE, ...siblingPathNodes.map((node) => node.position.y)) -
      getNodeHeight(target) -
      BRANCH_SHORTCUT_CLEARANCE
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

export async function computeWorkflowAutoLayout(
  graph: WorkflowGraphState,
  engine?: ElkLayoutEngine
): Promise<WorkflowGraphState> {
  const elkGraph = buildElkGraph(graph.nodes, graph.edges)
  const layoutEngine = engine ?? defaultElkLayoutEngine
  const layoutedGraph = await layoutEngine.layout(elkGraph)

  return {
    ...graph,
    nodes: applyBranchShortcutClearance(
      applyElkLayout(graph.nodes, layoutedGraph),
      graph.edges
    ),
  }
}
