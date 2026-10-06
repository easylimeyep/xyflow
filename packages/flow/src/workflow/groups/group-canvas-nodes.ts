import type { Node } from "@xyflow/react"

import type { WorkflowGroup, WorkflowNode } from "../types/types"

import { toGroupFrameId } from "./group-canvas-ids"
import { getCollapsedCardRect } from "./group-geometry"

export const GROUP_FRAME_NODE_TYPE = "groupFrame"
export const GROUP_CARD_NODE_TYPE = "groupCard"
/**
 * Frames sit beneath nodes and edges: a negative z-index puts them under the
 * edge layer, which React Flow paints before the nodes.
 */
export const GROUP_FRAME_Z_INDEX = -1
/**
 * React Flow lifts a selected node by this much so it draws over the rest. A
 * selected frame must stay beneath nodes and edges, so its z-index takes the
 * lift back.
 */
const REACT_FLOW_SELECTED_NODE_LIFT = 1000

export interface GroupCanvasNodeData {
  [key: string]: unknown
  groupId: string
  label: string
  color: WorkflowGroup["color"]
  memberIds: readonly string[]
  /** The state drawn: the saved flag, or the observe-mode override. */
  collapsed: boolean
  editable: boolean
}

export type GroupCanvasNode = Node<
  GroupCanvasNodeData,
  typeof GROUP_FRAME_NODE_TYPE | typeof GROUP_CARD_NODE_TYPE
>

export type CollapsedOverride = ReadonlyMap<string, boolean>

/**
 * React Flow never selects, focuses, connects, or deletes a group node: the
 * canvas owns group selection (clicks on the frame or card, a box that
 * encloses the whole frame), the header and card are the focus targets, and
 * Delete goes through the editor's commands.
 */
const NOT_SELECTABLE_BY_REACT_FLOW = {
  selectable: false,
  focusable: false,
  connectable: false,
  deletable: false,
} as const

export function isGroupEffectivelyCollapsed(
  group: WorkflowGroup,
  collapsedOverride: CollapsedOverride
): boolean {
  return collapsedOverride.get(group.id) ?? group.collapsed
}

export interface BuildGroupCanvasNodesOptions {
  collapsedOverride: CollapsedOverride
  selectedGroupIds: ReadonlySet<string>
  editable: boolean
}

function collectMemberIds(
  nodes: readonly WorkflowNode[]
): Map<string, string[]> {
  const memberIdsByGroupId = new Map<string, string[]>()
  for (const node of nodes) {
    const { groupId } = node.data
    if (groupId === undefined) continue
    const memberIds = memberIdsByGroupId.get(groupId)
    if (memberIds) {
      memberIds.push(node.id)
    } else {
      memberIdsByGroupId.set(groupId, [node.id])
    }
  }
  return memberIdsByGroupId
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, i) => id === right[i])
}

function buildGroupCanvasNode(
  group: WorkflowGroup,
  memberIds: readonly string[],
  collapsed: boolean,
  selected: boolean,
  editable: boolean
): GroupCanvasNode {
  const data: GroupCanvasNodeData = {
    groupId: group.id,
    label: group.label,
    color: group.color,
    memberIds,
    collapsed,
    editable,
  }

  if (collapsed) {
    const card = getCollapsedCardRect(group)
    return {
      id: toGroupFrameId(group.id),
      type: GROUP_CARD_NODE_TYPE,
      position: { x: card.x, y: card.y },
      width: card.width,
      height: card.height,
      data,
      selected,
      draggable: editable,
      ...NOT_SELECTABLE_BY_REACT_FLOW,
    }
  }

  return {
    id: toGroupFrameId(group.id),
    type: GROUP_FRAME_NODE_TYPE,
    position: { x: group.x, y: group.y },
    width: group.width,
    height: group.height,
    zIndex: selected
      ? GROUP_FRAME_Z_INDEX - REACT_FLOW_SELECTED_NODE_LIFT
      : GROUP_FRAME_Z_INDEX,
    data,
    selected,
    // The whole frame takes the pointer like a node: a click selects the
    // group and a drag moves it. Nodes and edges are drawn above it and still
    // get their own pointer events first.
    draggable: editable,
    ...NOT_SELECTABLE_BY_REACT_FLOW,
  }
}

interface CachedGroupNode {
  group: WorkflowGroup
  memberIds: readonly string[]
  collapsed: boolean
  selected: boolean
  editable: boolean
  node: GroupCanvasNode
}

/**
 * Projects groups into the derived React Flow nodes the canvas draws: an
 * expanded group as a frame beneath everything, a collapsed one as a card.
 *
 * Returns a builder that remembers the node it made per group and hands the
 * same object back while nothing about that group changed, so dragging an
 * unrelated node does not re-render every frame.
 */
export function createGroupCanvasNodeBuilder() {
  let cache = new Map<string, CachedGroupNode>()

  return function buildGroupCanvasNodes(
    groups: readonly WorkflowGroup[],
    nodes: readonly WorkflowNode[],
    options: BuildGroupCanvasNodesOptions
  ): GroupCanvasNode[] {
    if (groups.length === 0) {
      cache = new Map()
      return []
    }

    const memberIdsByGroupId = collectMemberIds(nodes)
    const nextCache = new Map<string, CachedGroupNode>()
    const result = groups.map((group) => {
      const freshMemberIds = memberIdsByGroupId.get(group.id) ?? []
      const collapsed = isGroupEffectivelyCollapsed(
        group,
        options.collapsedOverride
      )
      const selected = options.selectedGroupIds.has(group.id)
      const cached = cache.get(group.id)
      const memberIds =
        cached && sameIds(cached.memberIds, freshMemberIds)
          ? cached.memberIds
          : freshMemberIds
      const node =
        cached &&
        cached.group === group &&
        cached.memberIds === memberIds &&
        cached.collapsed === collapsed &&
        cached.selected === selected &&
        cached.editable === options.editable
          ? cached.node
          : buildGroupCanvasNode(
              group,
              memberIds,
              collapsed,
              selected,
              options.editable
            )
      nextCache.set(group.id, {
        group,
        memberIds,
        collapsed,
        selected,
        editable: options.editable,
        node,
      })
      return node
    })
    cache = nextCache
    return result
  }
}

/** Ids of the members hidden inside collapsed groups. */
export function getHiddenMemberIds(
  groups: readonly WorkflowGroup[],
  nodes: readonly WorkflowNode[],
  collapsedOverride: CollapsedOverride
): Set<string> {
  const collapsedGroupIds = new Set(
    groups
      .filter((group) => isGroupEffectivelyCollapsed(group, collapsedOverride))
      .map((group) => group.id)
  )
  const hidden = new Set<string>()
  if (collapsedGroupIds.size === 0) {
    return hidden
  }
  for (const node of nodes) {
    if (
      node.data.groupId !== undefined &&
      collapsedGroupIds.has(node.data.groupId)
    ) {
      hidden.add(node.id)
    }
  }
  return hidden
}

/**
 * Marks members of collapsed groups `hidden` for the canvas. Store nodes stay
 * untouched; a node keeps its identity unless its visibility flips, and the
 * same array comes back when nothing is hidden.
 */
export function hideCollapsedMembers(
  nodes: WorkflowNode[],
  hiddenNodeIds: ReadonlySet<string>
): WorkflowNode[] {
  if (hiddenNodeIds.size === 0 && !nodes.some((node) => node.hidden)) {
    return nodes
  }
  let changed = false
  const next = nodes.map((node) => {
    const hidden = hiddenNodeIds.has(node.id)
    if (Boolean(node.hidden) === hidden) return node
    changed = true
    return { ...node, hidden }
  })
  return changed ? next : nodes
}
