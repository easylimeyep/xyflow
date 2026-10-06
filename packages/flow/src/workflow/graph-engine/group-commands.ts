import {
  clampResize,
  fitToContents,
  getGroupMembers,
  withoutGroupId,
  type Rect,
} from "../groups/group-geometry"
import { createWorkflowError } from "../types/errors"
import {
  DEFAULT_WORKFLOW_GROUP_COLOR,
  type WorkflowGraphState,
  type WorkflowGroup,
  type WorkflowNode,
} from "../types/types"

import type {
  GraphEngineFailure,
  GraphEngineResult,
  GraphEngineSuccess,
} from "./commands"

const DEFAULT_GROUP_LABEL_PREFIX = "Group"

export interface GroupNodesCommand {
  nodeIds: string[]
  /** Fixed id for the new group; generated when omitted. */
  groupId?: string
}

export interface GroupNodesSuccess extends GraphEngineSuccess {
  groupId: string
}

export interface GroupCommand {
  groupId: string
}

export interface RenameGroupCommand extends GroupCommand {
  label: string
}

export interface RecolorGroupCommand extends GroupCommand {
  color: WorkflowGroup["color"]
}

export interface ResizeGroupCommand extends GroupCommand {
  rect: Rect
}

export interface SetGroupCollapsedCommand extends GroupCommand {
  collapsed: boolean
}

export interface MoveGroupCommand extends GroupCommand {
  dx: number
  dy: number
}

export interface DeleteGroupsCommand {
  groupIds: string[]
}

export interface DeleteGroupsSuccess extends GraphEngineSuccess {
  removedNodeIds: Set<string>
}

export function createGroupId(): string {
  return `group-${crypto.randomUUID()}`
}

function groupNotFound(groupId: string): GraphEngineFailure {
  return {
    ok: false,
    error: createWorkflowError(
      "GROUP_NOT_FOUND",
      `Failed to resolve group "${groupId}".`
    ),
  }
}

/** `Group N` with the smallest N no existing group uses. */
function createDefaultGroupLabel(groups: readonly WorkflowGroup[]): string {
  const usedLabels = new Set(groups.map((group) => group.label.trim()))
  let index = 1
  while (usedLabels.has(`${DEFAULT_GROUP_LABEL_PREFIX} ${index}`)) {
    index += 1
  }
  return `${DEFAULT_GROUP_LABEL_PREFIX} ${index}`
}

/**
 * Replaces one group through `update`. A failure when the group is missing; the
 * same graph when `update` returns the group unchanged, so callers can skip a
 * history step.
 */
function updateGroup(
  graph: WorkflowGraphState,
  groupId: string,
  update: (group: WorkflowGroup, members: WorkflowNode[]) => WorkflowGroup
): GraphEngineResult {
  const group = graph.groups.find((candidate) => candidate.id === groupId)
  if (!group) {
    return groupNotFound(groupId)
  }

  const nextGroup = update(group, getGroupMembers(groupId, graph.nodes))
  if (nextGroup === group) {
    return { ok: true, nextGraph: graph }
  }

  return {
    ok: true,
    nextGraph: {
      ...graph,
      groups: graph.groups.map((candidate) =>
        candidate.id === groupId ? nextGroup : candidate
      ),
    },
  }
}

export function applyGroupNodesCommand(
  graph: WorkflowGraphState,
  command: GroupNodesCommand
): GroupNodesSuccess | GraphEngineFailure {
  const nodeIdSet = new Set(command.nodeIds)
  const members = graph.nodes.filter((node) => nodeIdSet.has(node.id))
  if (members.length === 0 || members.length !== nodeIdSet.size) {
    return {
      ok: false,
      error: createWorkflowError(
        "INVALID_GROUP_SELECTION",
        "Grouping needs one or more existing nodes."
      ),
    }
  }
  if (members.some((node) => node.data.groupId !== undefined)) {
    return {
      ok: false,
      error: createWorkflowError(
        "INVALID_GROUP_SELECTION",
        "A node that already belongs to a group cannot be grouped again."
      ),
    }
  }

  const groupId = command.groupId ?? createGroupId()
  const seed: WorkflowGroup = {
    id: groupId,
    label: createDefaultGroupLabel(graph.groups),
    color: DEFAULT_WORKFLOW_GROUP_COLOR,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    collapsed: false,
  }

  return {
    ok: true,
    groupId,
    nextGraph: {
      ...graph,
      nodes: graph.nodes.map((node) =>
        nodeIdSet.has(node.id)
          ? { ...node, data: { ...node.data, groupId } }
          : node
      ),
      groups: [...graph.groups, fitToContents(seed, members)],
    },
  }
}

export function applyUngroupCommand(
  graph: WorkflowGraphState,
  command: GroupCommand
): GraphEngineResult {
  if (!graph.groups.some((group) => group.id === command.groupId)) {
    return groupNotFound(command.groupId)
  }

  return {
    ok: true,
    nextGraph: {
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.data.groupId === command.groupId
          ? { ...node, data: withoutGroupId(node.data) }
          : node
      ),
      groups: graph.groups.filter((group) => group.id !== command.groupId),
    },
  }
}

/** Removes the groups together with their members and every edge touching them. */
export function applyDeleteGroupsCommand(
  graph: WorkflowGraphState,
  command: DeleteGroupsCommand
): DeleteGroupsSuccess {
  const groupIdSet = new Set(command.groupIds)
  const removedNodeIds = new Set(
    graph.nodes
      .filter(
        (node) =>
          node.data.groupId !== undefined && groupIdSet.has(node.data.groupId)
      )
      .map((node) => node.id)
  )

  return {
    ok: true,
    removedNodeIds,
    nextGraph: {
      ...graph,
      nodes: graph.nodes.filter((node) => !removedNodeIds.has(node.id)),
      edges: graph.edges.filter(
        (edge) =>
          !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target)
      ),
      groups: graph.groups.filter((group) => !groupIdSet.has(group.id)),
    },
  }
}

export function applyRenameGroupCommand(
  graph: WorkflowGraphState,
  command: RenameGroupCommand
): GraphEngineResult {
  const label = command.label.trim()
  if (label === "") {
    return {
      ok: false,
      error: createWorkflowError(
        "INVALID_GROUP_LABEL",
        "Group label cannot be empty."
      ),
    }
  }

  return updateGroup(graph, command.groupId, (group) =>
    group.label === label ? group : { ...group, label }
  )
}

export function applyRecolorGroupCommand(
  graph: WorkflowGraphState,
  command: RecolorGroupCommand
): GraphEngineResult {
  return updateGroup(graph, command.groupId, (group) =>
    group.color === command.color ? group : { ...group, color: command.color }
  )
}

export function applyResizeGroupCommand(
  graph: WorkflowGraphState,
  command: ResizeGroupCommand
): GraphEngineResult {
  return updateGroup(graph, command.groupId, (group, members) =>
    clampResize(group, members, command.rect)
  )
}

/** Collapsing also deselects the members, which are about to be hidden. */
export function applySetGroupCollapsedCommand(
  graph: WorkflowGraphState,
  command: SetGroupCollapsedCommand
): GraphEngineResult {
  const result = updateGroup(graph, command.groupId, (group) =>
    group.collapsed === command.collapsed
      ? group
      : { ...group, collapsed: command.collapsed }
  )
  if (!result.ok || !command.collapsed) {
    return result
  }

  const hasSelectedMember = result.nextGraph.nodes.some(
    (node) => node.selected && node.data.groupId === command.groupId
  )
  if (!hasSelectedMember) {
    return result
  }

  return {
    ok: true,
    nextGraph: {
      ...result.nextGraph,
      nodes: result.nextGraph.nodes.map((node) =>
        node.selected && node.data.groupId === command.groupId
          ? { ...node, selected: false }
          : node
      ),
    },
  }
}

/** Translates a group's rectangle and every member by the same offset. */
export function moveGroupBy(
  graph: WorkflowGraphState,
  groupIds: ReadonlySet<string>,
  dx: number,
  dy: number
): WorkflowGraphState {
  if ((dx === 0 && dy === 0) || groupIds.size === 0) {
    return graph
  }

  return {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.data.groupId !== undefined && groupIds.has(node.data.groupId)
        ? {
            ...node,
            position: { x: node.position.x + dx, y: node.position.y + dy },
          }
        : node
    ),
    groups: graph.groups.map((group) =>
      groupIds.has(group.id)
        ? { ...group, x: group.x + dx, y: group.y + dy }
        : group
    ),
  }
}

export function applyMoveGroupCommand(
  graph: WorkflowGraphState,
  command: MoveGroupCommand
): GraphEngineResult {
  if (!graph.groups.some((group) => group.id === command.groupId)) {
    return groupNotFound(command.groupId)
  }

  return {
    ok: true,
    nextGraph: moveGroupBy(
      graph,
      new Set([command.groupId]),
      command.dx,
      command.dy
    ),
  }
}
