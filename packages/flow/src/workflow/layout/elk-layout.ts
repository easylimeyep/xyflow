import ELK from "elkjs/lib/elk.bundled.js"

import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from "../node-registry/node-factory"
import type { WorkflowEdge, WorkflowGraphState, WorkflowNode } from "../types/types"
import {
  getElkPortId,
  resolveWorkflowLayoutPorts,
  type WorkflowLayoutPorts,
} from "./elk-ports"
import {
  WORKFLOW_ELK_PORT_CONSTRAINTS,
  workflowElkLayoutOptions,
} from "./elk-options"

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

function getNodeWidth(node: WorkflowNode): number {
  return node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH
}

function getNodeHeight(node: WorkflowNode): number {
  return node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT
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

    if (!sourcePorts || !sourcePorts.outputHandles.some((handle) => handle.id === sourceHandleId)) {
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
    (layoutedGraph.children ?? []).map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }] as const)
  )

  let didChange = false
  const nextNodes = nodes.map((node) => {
    const nextPosition = positionsById.get(node.id)
    if (!nextPosition) {
      return node
    }

    if (node.position.x === nextPosition.x && node.position.y === nextPosition.y) {
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

export async function computeWorkflowAutoLayout(
  graph: WorkflowGraphState,
  engine?: ElkLayoutEngine
): Promise<WorkflowGraphState> {
  const elkGraph = buildElkGraph(graph.nodes, graph.edges)
  const layoutEngine = engine ?? defaultElkLayoutEngine
  const layoutedGraph = await layoutEngine.layout(elkGraph)

  return {
    ...graph,
    nodes: applyElkLayout(graph.nodes, layoutedGraph),
  }
}
