/**
 * Group frames and collapsed cards are drawn as derived React Flow nodes. They
 * share one id per group, prefixed so they can never collide with a node id
 * and are easy to route away from the node channels.
 */
export const GROUP_FRAME_ID_PREFIX = "group-frame:"

export function toGroupFrameId(groupId: string): string {
  return `${GROUP_FRAME_ID_PREFIX}${groupId}`
}

/** The group id behind a canvas node id, or `null` for a workflow node. */
export function parseGroupFrameId(canvasNodeId: string): string | null {
  return canvasNodeId.startsWith(GROUP_FRAME_ID_PREFIX)
    ? canvasNodeId.slice(GROUP_FRAME_ID_PREFIX.length)
    : null
}
