import {
  fitToContents,
  getGroupMembers,
  getMemberBounds,
} from "../groups/group-geometry"
import type { NodeRegistry } from "../node-registry/registry"
import type {
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowNode,
} from "../types/types"
import {
  applyElkLayout,
  applyEvaluatorShortcutClearance,
  buildElkGraph,
  defaultElkLayoutEngine,
  type ElkLayoutEngine,
} from "./elk-layout"

/**
 * Lays out the members of one expanded group with ELK, using only the edges
 * between two members, then fits the frame around them. The arrangement starts
 * at the top-left corner the members occupied before, so the group stays where
 * it was; nodes outside the group never move. Returns the same graph when the
 * group is missing, collapsed, or empty, or when nothing moves.
 */
export async function computeGroupArrangeLayout(
  registry: NodeRegistry,
  graph: WorkflowGraphState,
  groupId: string,
  engine: ElkLayoutEngine = defaultElkLayoutEngine
): Promise<WorkflowGraphState> {
  const group = graph.groups.find((candidate) => candidate.id === groupId)
  if (!group || group.collapsed) {
    return graph
  }
  const members = getGroupMembers(groupId, graph.nodes)
  const before = getMemberBounds(members)
  if (!before) {
    return graph
  }

  const internalEdges = getInternalEdges(graph.edges, members)
  const layouted = await engine.layout(
    buildElkGraph(registry, members, internalEdges)
  )
  const laidOut = applyEvaluatorShortcutClearance(
    applyElkLayout(members, layouted),
    internalEdges
  )
  const arranged = anchorAt(laidOut, before, members)

  const fitted = fitToContents(group, arranged)
  const arrangedById = new Map(arranged.map((member) => [member.id, member]))
  const hasMoved = members.some(
    (member) => arrangedById.get(member.id) !== member
  )
  if (!hasMoved && fitted === group) {
    return graph
  }

  return {
    ...graph,
    nodes: graph.nodes.map((node) => arrangedById.get(node.id) ?? node),
    groups: graph.groups.map((candidate) =>
      candidate === group ? fitted : candidate
    ),
  }
}

/**
 * Carries an arrangement computed from `start` over to `current`, the graph
 * as it is when the async layout finishes. Edits the layout does not depend
 * on — selection, labels, other nodes and groups — are kept, and the members
 * and frame take their arranged places. Returns `null` when the layout's
 * inputs changed: the group was deleted or collapsed, a member joined, left,
 * moved, or was resized, or an edge between members changed.
 */
export function rebaseGroupArrange(
  start: WorkflowGraphState,
  arranged: WorkflowGraphState,
  current: WorkflowGraphState,
  groupId: string
): WorkflowGraphState | null {
  if (current === start) {
    return arranged
  }
  const startGroup = start.groups.find((group) => group.id === groupId)
  const currentGroup = current.groups.find((group) => group.id === groupId)
  const arrangedGroup = arranged.groups.find((group) => group.id === groupId)
  if (
    !startGroup ||
    !currentGroup ||
    !arrangedGroup ||
    currentGroup.collapsed !== startGroup.collapsed
  ) {
    return null
  }

  const startMembers = getGroupMembers(groupId, start.nodes)
  const currentMembers = getGroupMembers(groupId, current.nodes)
  if (
    !haveSameGeometry(startMembers, currentMembers) ||
    getEdgesKey(getInternalEdges(start.edges, startMembers)) !==
      getEdgesKey(getInternalEdges(current.edges, currentMembers))
  ) {
    return null
  }

  const arrangedById = new Map(arranged.nodes.map((node) => [node.id, node]))
  return {
    ...current,
    nodes: current.nodes.map((node) => {
      const position = arrangedById.get(node.id)?.position
      if (node.data.groupId !== groupId || !position) return node
      return node.position.x === position.x && node.position.y === position.y
        ? node
        : { ...node, position }
    }),
    groups: current.groups.map((group) =>
      group === currentGroup
        ? {
            ...group,
            x: arrangedGroup.x,
            y: arrangedGroup.y,
            width: arrangedGroup.width,
            height: arrangedGroup.height,
          }
        : group
    ),
  }
}

function getInternalEdges(
  edges: readonly WorkflowEdge[],
  members: readonly WorkflowNode[]
): WorkflowEdge[] {
  const memberIds = new Set(members.map((member) => member.id))
  return edges.filter(
    (edge) => memberIds.has(edge.source) && memberIds.has(edge.target)
  )
}

function getEdgesKey(edges: readonly WorkflowEdge[]): string {
  return edges
    .map(
      (edge) =>
        `${edge.id}\u0000${edge.source}\u0000${edge.sourceHandle ?? ""}\u0000${edge.target}\u0000${edge.targetHandle ?? ""}`
    )
    .sort()
    .join("\u0001")
}

/** Whether both lists hold the same nodes at the same positions and sizes. */
function haveSameGeometry(
  before: readonly WorkflowNode[],
  after: readonly WorkflowNode[]
): boolean {
  if (before.length !== after.length) return false
  const afterById = new Map(after.map((node) => [node.id, node]))
  return before.every((node) => {
    const other = afterById.get(node.id)
    return (
      other !== undefined &&
      other.position.x === node.position.x &&
      other.position.y === node.position.y &&
      other.measured?.width === node.measured?.width &&
      other.measured?.height === node.measured?.height &&
      other.width === node.width &&
      other.height === node.height
    )
  })
}

/**
 * Translates `nodes` so their bounds start at `origin`. A node that ends up
 * where it was in `originals` is returned as that original object.
 */
function anchorAt(
  nodes: readonly WorkflowNode[],
  origin: { x: number; y: number },
  originals: readonly WorkflowNode[]
): WorkflowNode[] {
  const bounds = getMemberBounds(nodes)
  const dx = bounds ? origin.x - bounds.x : 0
  const dy = bounds ? origin.y - bounds.y : 0
  const originalById = new Map(originals.map((node) => [node.id, node]))

  return nodes.map((node) => {
    const x = node.position.x + dx
    const y = node.position.y + dy
    const original = originalById.get(node.id)
    if (original && original.position.x === x && original.position.y === y) {
      return original
    }
    return { ...node, position: { x, y } }
  })
}
