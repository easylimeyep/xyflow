import type { NodeChange } from "@xyflow/react"

import { moveGroupBy } from "../graph-engine/group-commands"
import type { WorkflowGraphState, WorkflowNode } from "../types/types"

import { parseGroupFrameId } from "./group-canvas-ids"
import {
  previewGroupGrowth,
  resolveMembershipAfterDrag,
} from "./group-membership"

export interface GroupFramePosition {
  groupId: string
  x: number
  y: number
}

/**
 * Splits a React Flow change batch into the changes for workflow nodes and the
 * positions of dragged group frames. Node position changes for members of a
 * dragged group are dropped: those members move with the group, never twice.
 */
export function splitGroupFrameChanges(
  graph: WorkflowGraphState,
  changes: NodeChange<WorkflowNode>[]
): {
  nodeChanges: NodeChange<WorkflowNode>[]
  framePositions: GroupFramePosition[]
} {
  const framePositions: GroupFramePosition[] = []
  for (const change of changes) {
    if (change.type !== "position" || !change.position) continue
    const groupId = parseGroupFrameId(change.id)
    if (groupId === null) continue
    framePositions.push({ groupId, ...change.position })
  }
  if (framePositions.length === 0) {
    return {
      nodeChanges: changes.filter(
        (change) => !("id" in change) || parseGroupFrameId(change.id) === null
      ),
      framePositions,
    }
  }

  const movedGroupIds = new Set(framePositions.map((frame) => frame.groupId))
  const memberIds = new Set(
    graph.nodes
      .filter(
        (node) =>
          node.data.groupId !== undefined &&
          movedGroupIds.has(node.data.groupId)
      )
      .map((node) => node.id)
  )
  return {
    nodeChanges: changes.filter((change) => {
      if (!("id" in change)) return true
      if (parseGroupFrameId(change.id) !== null) return false
      return !(change.type === "position" && memberIds.has(change.id))
    }),
    framePositions,
  }
}

/** Moves each dragged group (rectangle and members) to its frame's new position. */
export function applyGroupFramePositions(
  graph: WorkflowGraphState,
  framePositions: readonly GroupFramePosition[]
): WorkflowGraphState {
  let next = graph
  for (const frame of framePositions) {
    const group = next.groups.find(
      (candidate) => candidate.id === frame.groupId
    )
    if (!group) continue
    next = moveGroupBy(
      next,
      new Set([frame.groupId]),
      frame.x - group.x,
      frame.y - group.y
    )
  }
  return next
}

/**
 * Applies what a node drag means for groups on top of the moved graph: while
 * dragging, frames grow to follow members still inside them; on drop, the
 * dropped nodes join, leave, or switch groups. Members of a dragged group are
 * excluded — they moved with their group.
 */
export function applyGroupDragEffects(
  graph: WorkflowGraphState,
  changes: NodeChange<WorkflowNode>[],
  originGraph: WorkflowGraphState,
  movedGroupIds: ReadonlySet<string>
): WorkflowGraphState {
  if (graph.groups.length === 0) {
    return graph
  }

  const positionChanges = changes.filter((change) => change.type === "position")
  if (positionChanges.length === 0) {
    return graph
  }

  const draggingIds: string[] = []
  const droppedIds: string[] = []
  const changedIds = new Set(positionChanges.map((change) => change.id))
  const nodeById = new Map(
    graph.nodes
      .filter((node) => changedIds.has(node.id))
      .map((node) => [node.id, node])
  )
  for (const change of positionChanges) {
    if (change.type !== "position") continue
    const node = nodeById.get(change.id)
    if (!node) continue
    if (node.data.groupId !== undefined && movedGroupIds.has(node.data.groupId))
      continue
    ;(change.dragging ? draggingIds : droppedIds).push(change.id)
  }

  // Frames are judged where they stood before the drag — except the frames
  // this drag moves, which are judged where they are now.
  const referenceGroups =
    movedGroupIds.size === 0
      ? originGraph.groups
      : graph.groups.map((group) =>
          movedGroupIds.has(group.id)
            ? group
            : (originGraph.groups.find((g) => g.id === group.id) ?? group)
        )

  let next = graph
  if (draggingIds.length > 0) {
    next = previewGroupGrowth(next, draggingIds, referenceGroups)
  }
  if (droppedIds.length > 0) {
    next = resolveMembershipAfterDrag(next, droppedIds, referenceGroups)
  }
  return next
}
