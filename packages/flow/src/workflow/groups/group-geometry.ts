import { getEstimatedNodeHeight } from "../layout/node-size-estimate"
import { DEFAULT_NODE_WIDTH } from "../node-registry/node-factory"
import type {
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../types/types"

/** Space between the members and the frame's sides and bottom. */
export const GROUP_FRAME_PADDING = 24
/** Height of the frame header that holds the label; sits above the members. */
export const GROUP_FRAME_HEADER_HEIGHT = 40
/** The smallest an empty group can be resized to. */
export const GROUP_MIN_WIDTH = 200
export const GROUP_MIN_HEIGHT = 120
/** Size of the card a collapsed group is drawn as. */
export const GROUP_CARD_WIDTH = 240
export const GROUP_CARD_HEIGHT = 64

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Size of a node as the canvas draws it. An unmeasured node falls back to the
 * same box a compact node draws, so a frame fitted before measurement does not
 * jump once the node renders.
 */
function getNodeRect(node: WorkflowNode): Rect {
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH,
    height:
      node.measured?.height ?? node.height ?? getEstimatedNodeHeight(node),
  }
}

export function getGroupMembers(
  groupId: string,
  nodes: readonly WorkflowNode[]
): WorkflowNode[] {
  return nodes.filter((node) => node.data.groupId === groupId)
}

/** The box enclosing every member, or `null` for an empty group. */
export function getMemberBounds(members: readonly WorkflowNode[]): Rect | null {
  if (members.length === 0) {
    return null
  }

  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const member of members) {
    const rect = getNodeRect(member)
    left = Math.min(left, rect.x)
    top = Math.min(top, rect.y)
    right = Math.max(right, rect.x + rect.width)
    bottom = Math.max(bottom, rect.y + rect.height)
  }

  return { x: left, y: top, width: right - left, height: bottom - top }
}

/** The smallest frame around `members`: their bounds plus padding and header. */
function getRequiredRect(members: readonly WorkflowNode[]): Rect | null {
  const bounds = getMemberBounds(members)
  if (!bounds) {
    return null
  }

  return {
    x: bounds.x - GROUP_FRAME_PADDING,
    y: bounds.y - GROUP_FRAME_PADDING - GROUP_FRAME_HEADER_HEIGHT,
    width: bounds.width + 2 * GROUP_FRAME_PADDING,
    height: bounds.height + 2 * GROUP_FRAME_PADDING + GROUP_FRAME_HEADER_HEIGHT,
  }
}

function withRect(group: WorkflowGroup, rect: Rect): WorkflowGroup {
  if (
    group.x === rect.x &&
    group.y === rect.y &&
    group.width === rect.width &&
    group.height === rect.height
  ) {
    return group
  }

  return { ...group, ...rect }
}

/**
 * Expands the frame so it encloses `members`. Never shrinks it: a frame only
 * gets smaller when the user resizes or fits it. Returns the same group when it
 * already encloses them.
 */
export function growToFit(
  group: WorkflowGroup,
  members: readonly WorkflowNode[]
): WorkflowGroup {
  const required = getRequiredRect(members)
  if (!required) {
    return group
  }

  const left = Math.min(group.x, required.x)
  const top = Math.min(group.y, required.y)
  const right = Math.max(group.x + group.width, required.x + required.width)
  const bottom = Math.max(group.y + group.height, required.y + required.height)

  return withRect(group, {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  })
}

/** Resizes a non-empty frame to exactly enclose its members; an empty one is kept. */
export function fitToContents(
  group: WorkflowGroup,
  members: readonly WorkflowNode[]
): WorkflowGroup {
  const required = getRequiredRect(members)
  return required ? withRect(group, required) : group
}

interface Span {
  start: number
  end: number
}

/**
 * Clamps one axis of a resize. Each edge is limited on its own, so the edge the
 * user is not dragging stays where it is: with a required span, the start may
 * not pass its start and the end may not pass its end; then a span shorter
 * than `min` is lengthened from whichever edge moved.
 */
function clampSpan(
  current: Span,
  next: Span,
  required: Span | null,
  min: number
): Span {
  const startMoved = next.start !== current.start
  const endMoved = next.end !== current.end
  // Only the edge being dragged is held back by the members; the other one
  // stays put even when the stored frame does not enclose them (imported
  // data, a member that grew).
  let start =
    required && startMoved ? Math.min(next.start, required.start) : next.start
  let end = required && endMoved ? Math.max(next.end, required.end) : next.end

  if (end - start < min) {
    if (startMoved) {
      start = end - min
    } else {
      end = start + min
    }
  }

  return { start, end }
}

/**
 * Applies a resize the user is dragging, limited so the frame still encloses
 * its members (plus padding and header), and an empty frame stays at least
 * `GROUP_MIN_WIDTH × GROUP_MIN_HEIGHT`.
 */
export function clampResize(
  group: WorkflowGroup,
  members: readonly WorkflowNode[],
  nextRect: Rect
): WorkflowGroup {
  const required = getRequiredRect(members)
  const horizontal = clampSpan(
    { start: group.x, end: group.x + group.width },
    { start: nextRect.x, end: nextRect.x + nextRect.width },
    required ? { start: required.x, end: required.x + required.width } : null,
    GROUP_MIN_WIDTH
  )
  const vertical = clampSpan(
    { start: group.y, end: group.y + group.height },
    { start: nextRect.y, end: nextRect.y + nextRect.height },
    required ? { start: required.y, end: required.y + required.height } : null,
    GROUP_MIN_HEIGHT
  )

  return withRect(group, {
    x: horizontal.start,
    y: vertical.start,
    width: horizontal.end - horizontal.start,
    height: vertical.end - vertical.start,
  })
}

/** The card a collapsed group is drawn as: a fixed size at the group's corner. */
export function getCollapsedCardRect(group: WorkflowGroup): Rect {
  return {
    x: group.x,
    y: group.y,
    width: GROUP_CARD_WIDTH,
    height: GROUP_CARD_HEIGHT,
  }
}

/**
 * Removes `data.groupId` from nodes whose group no longer exists. Groups are
 * never removed here: an empty group stays until the user removes it.
 */
export function clearDanglingGroupIds(
  graph: WorkflowGraphState
): WorkflowGraphState {
  const groupIds = new Set(graph.groups.map((group) => group.id))
  let changed = false
  const nodes = graph.nodes.map((node) => {
    const { groupId } = node.data
    if (groupId === undefined || groupIds.has(groupId)) {
      return node
    }
    changed = true
    return { ...node, data: withoutGroupId(node.data) }
  })

  return changed ? { ...graph, nodes } : graph
}

/** Node data with `groupId` removed rather than set to `undefined`. */
export function withoutGroupId(
  data: WorkflowNode["data"]
): WorkflowNode["data"] {
  const next = { ...data }
  delete next.groupId
  return next
}
