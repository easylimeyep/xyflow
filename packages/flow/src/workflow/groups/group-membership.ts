import { getEstimatedNodeHeight } from "../layout/node-size-estimate"
import { DEFAULT_NODE_WIDTH } from "../node-registry/node-factory"
import type {
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../types/types"

import { getGroupMembers, growToFit, withoutGroupId } from "./group-geometry"

interface Point {
  x: number
  y: number
}

function getNodeCenter(node: WorkflowNode): Point {
  const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH
  const height =
    node.measured?.height ?? node.height ?? getEstimatedNodeHeight(node)
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  }
}

function containsPoint(group: WorkflowGroup, point: Point): boolean {
  return (
    point.x >= group.x &&
    point.x <= group.x + group.width &&
    point.y >= group.y &&
    point.y <= group.y + group.height
  )
}

/**
 * The rectangle a group had before the drag started. Mid-drag writes may have
 * grown it (see {@link previewGroupGrowth}); containment and growth are both
 * judged from where the frame stood when the user picked the node up.
 */
function getReferenceGroup(
  group: WorkflowGroup,
  referenceById: ReadonlyMap<string, WorkflowGroup>
): WorkflowGroup {
  const reference = referenceById.get(group.id)
  return reference
    ? {
        ...group,
        x: reference.x,
        y: reference.y,
        width: reference.width,
        height: reference.height,
      }
    : group
}

/** The smallest expanded frame containing `point`, if any. Collapsed cards never capture. */
function findTargetGroup(
  groups: readonly WorkflowGroup[],
  point: Point
): WorkflowGroup | undefined {
  let target: WorkflowGroup | undefined
  for (const group of groups) {
    if (group.collapsed || !containsPoint(group, point)) continue
    if (!target || group.width * group.height < target.width * target.height) {
      target = group
    }
  }
  return target
}

/**
 * Settles membership for nodes that were just dropped (or added) at their
 * current positions: a node whose center lies in an expanded frame joins it
 * (the smallest one wins), a member whose center left its frame leaves, and
 * every group that holds a dropped node grows to enclose its members.
 *
 * Returns the same graph when nothing changes.
 */
export function resolveMembershipAfterDrag(
  graph: WorkflowGraphState,
  droppedNodeIds: Iterable<string>,
  referenceGroups: readonly WorkflowGroup[] = graph.groups
): WorkflowGraphState {
  const droppedIds = new Set(droppedNodeIds)
  if (droppedIds.size === 0 || graph.groups.length === 0) {
    return graph
  }

  const referenceById = new Map(referenceGroups.map((g) => [g.id, g]))
  const frames = graph.groups.map((group) =>
    getReferenceGroup(group, referenceById)
  )
  const touchedGroupIds = new Set<string>()
  let nodesChanged = false
  const nodes = graph.nodes.map((node) => {
    if (!droppedIds.has(node.id)) return node

    const target = findTargetGroup(frames, getNodeCenter(node))
    if (target) touchedGroupIds.add(target.id)
    const nextGroupId = target?.id
    if (node.data.groupId === nextGroupId) return node

    // A member of a collapsed group is hidden and cannot be dropped anywhere;
    // keep it rather than guess.
    const currentGroup = frames.find((g) => g.id === node.data.groupId)
    if (!target && currentGroup?.collapsed) return node

    if (node.data.groupId !== undefined) touchedGroupIds.add(node.data.groupId)
    nodesChanged = true
    return {
      ...node,
      data:
        nextGroupId === undefined
          ? withoutGroupId(node.data)
          : { ...node.data, groupId: nextGroupId },
    }
  })

  let groupsChanged = false
  const groups = graph.groups.map((group, index) => {
    if (!touchedGroupIds.has(group.id)) return group
    const reference = frames[index] ?? group
    const next = growToFit(reference, getGroupMembers(group.id, nodes))
    const settled = sameRect(next, group) ? group : next
    if (settled !== group) groupsChanged = true
    return settled
  })

  if (!nodesChanged && !groupsChanged) {
    return graph
  }
  return {
    ...graph,
    nodes: nodesChanged ? nodes : graph.nodes,
    groups: groupsChanged ? groups : graph.groups,
  }
}

/**
 * The frames as they should look mid-drag: each expanded group with a dragged
 * member grows from its pre-drag rectangle to enclose the members whose center
 * is still inside it. A member dragged out is not followed, so it can leave.
 * Membership itself never changes here; that waits for the drop.
 */
export function previewGroupGrowth(
  graph: WorkflowGraphState,
  draggedNodeIds: Iterable<string>,
  referenceGroups: readonly WorkflowGroup[]
): WorkflowGraphState {
  const draggedIds = new Set(draggedNodeIds)
  const affectedGroupIds = new Set<string>()
  graph.nodes.forEach((node) => {
    if (draggedIds.has(node.id) && node.data.groupId !== undefined) {
      affectedGroupIds.add(node.data.groupId)
    }
  })
  if (affectedGroupIds.size === 0) {
    return graph
  }

  const referenceById = new Map(referenceGroups.map((g) => [g.id, g]))
  let changed = false
  const groups = graph.groups.map((group) => {
    if (group.collapsed || !affectedGroupIds.has(group.id)) return group
    const reference = getReferenceGroup(group, referenceById)
    const insideMembers = getGroupMembers(group.id, graph.nodes).filter(
      (member) => containsPoint(reference, getNodeCenter(member))
    )
    const next = growToFit(reference, insideMembers)
    if (sameRect(next, group)) return group
    changed = true
    return next
  })

  return changed ? { ...graph, groups } : graph
}

function sameRect(left: WorkflowGroup, right: WorkflowGroup): boolean {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  )
}
