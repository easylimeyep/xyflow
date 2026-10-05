import { toGroupFrameId } from "../groups/group-canvas-ids"
import {
  fitToContents,
  getCollapsedCardRect,
  getGroupMembers,
} from "../groups/group-geometry"
import type {
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../types/types"

/** A collapsed group laid out as one node, the size of its card. */
export interface ElkGroupBlock {
  /** The block's layout id: the group's canvas id, never a node id. */
  id: string
  groupId: string
  width: number
  height: number
  memberIds: ReadonlySet<string>
}

/** One block per collapsed group that has members. */
export function collectCollapsedBlocks(
  graph: Pick<WorkflowGraphState, "nodes" | "groups">
): ElkGroupBlock[] {
  return graph.groups.flatMap((group) => {
    if (!group.collapsed) return []
    const members = getGroupMembers(group.id, graph.nodes)
    if (members.length === 0) return []
    const card = getCollapsedCardRect(group)
    return [
      {
        id: toGroupFrameId(group.id),
        groupId: group.id,
        width: card.width,
        height: card.height,
        memberIds: new Set(members.map((member) => member.id)),
      },
    ]
  })
}

/**
 * The edges the layout sees once collapsed groups are blocks: an edge into or
 * out of a hidden member attaches to its block's single port, an edge between
 * two members of one block disappears, and edges that end up joining the same
 * two ports are kept once.
 */
export function remapEdgesToBlocks(
  edges: readonly WorkflowEdge[],
  blocks: readonly ElkGroupBlock[]
): WorkflowEdge[] {
  if (blocks.length === 0) {
    return [...edges]
  }
  const blockByMemberId = new Map<string, ElkGroupBlock>()
  blocks.forEach((block) =>
    block.memberIds.forEach((memberId) => blockByMemberId.set(memberId, block))
  )

  const seen = new Set<string>()
  const result: WorkflowEdge[] = []
  for (const edge of edges) {
    const sourceBlock = blockByMemberId.get(edge.source)
    const targetBlock = blockByMemberId.get(edge.target)
    if (sourceBlock && sourceBlock === targetBlock) continue
    if (!sourceBlock && !targetBlock) {
      result.push(edge)
      continue
    }

    const remapped: WorkflowEdge = {
      ...edge,
      source: sourceBlock?.id ?? edge.source,
      target: targetBlock?.id ?? edge.target,
      sourceHandle: sourceBlock ? null : (edge.sourceHandle ?? null),
      targetHandle: targetBlock ? null : (edge.targetHandle ?? null),
    }
    const key = `${remapped.source}\u0000${remapped.sourceHandle}\u0000${remapped.target}\u0000${remapped.targetHandle}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(remapped)
  }
  return result
}

/**
 * Moves each collapsed group to where the layout put its block, taking its
 * hidden members along so their arrangement inside the group is unchanged.
 */
export function applyBlockPositions(
  graph: WorkflowGraphState,
  blocks: readonly ElkGroupBlock[],
  positionsById: ReadonlyMap<string, { x: number; y: number }>
): WorkflowGraphState {
  const deltaByGroupId = new Map<string, { dx: number; dy: number }>()
  for (const block of blocks) {
    const position = positionsById.get(block.id)
    const group = graph.groups.find((g) => g.id === block.groupId)
    if (!position || !group) continue
    const dx = position.x - group.x
    const dy = position.y - group.y
    if (dx !== 0 || dy !== 0) deltaByGroupId.set(group.id, { dx, dy })
  }
  if (deltaByGroupId.size === 0) {
    return graph
  }

  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const delta =
        node.data.groupId === undefined
          ? undefined
          : deltaByGroupId.get(node.data.groupId)
      return delta
        ? {
            ...node,
            position: {
              x: node.position.x + delta.dx,
              y: node.position.y + delta.dy,
            },
          }
        : node
    }),
    groups: graph.groups.map((group) => {
      const delta = deltaByGroupId.get(group.id)
      return delta
        ? { ...group, x: group.x + delta.dx, y: group.y + delta.dy }
        : group
    }),
  }
}

/**
 * After a layout every non-empty expanded frame is fitted to its members at
 * their new positions; an empty frame keeps its rectangle, as does a
 * collapsed one, which moved with its block.
 */
export function fitExpandedGroups(
  nodes: readonly WorkflowNode[],
  groups: readonly WorkflowGroup[]
): WorkflowGroup[] {
  let changed = false
  const next = groups.map((group) => {
    if (group.collapsed) return group
    const fitted = fitToContents(group, getGroupMembers(group.id, nodes))
    if (fitted !== group) changed = true
    return fitted
  })
  return changed ? next : (groups as WorkflowGroup[])
}
