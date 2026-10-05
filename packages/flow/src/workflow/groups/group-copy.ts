import type { XYPosition } from "@xyflow/react"

import { createGroupId } from "../graph-engine/group-commands"
import { toDomainGroups } from "../mappers/converters/converters"
import type {
  DomainWorkflowGroupDTO,
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../types/types"

import { normalizeGroupColor } from "./group-colors"
import { withoutGroupId } from "./group-geometry"

export interface CopiedSelection {
  /** The copied nodes: the selected ones plus every member of a selected group. */
  nodeIds: Set<string>
  /** Whole groups only; `nodeIds` list copied members. */
  groups: DomainWorkflowGroupDTO[]
}

/**
 * Decides which groups travel with a copy or a duplicate: every selected group
 * (with all of its members, even an empty one), and every group whose members
 * were all copied. A group only partly copied is left out, so its copied
 * members land ungrouped.
 */
export function collectCopiedSelection(
  graph: Pick<WorkflowGraphState, "nodes" | "groups">,
  selectedNodeIds: Iterable<string>,
  selectedGroupIds: Iterable<string> = []
): CopiedSelection {
  const selectedGroupIdSet = new Set(selectedGroupIds)
  const nodeIds = new Set(selectedNodeIds)
  graph.nodes.forEach((node) => {
    const { groupId } = node.data
    if (groupId !== undefined && selectedGroupIdSet.has(groupId)) {
      nodeIds.add(node.id)
    }
  })

  const groups = toDomainGroups(graph).filter((group) => {
    if (selectedGroupIdSet.has(group.id)) {
      return true
    }
    return (
      group.nodeIds.length > 0 &&
      group.nodeIds.every((nodeId) => nodeIds.has(nodeId))
    )
  })

  return { nodeIds, groups }
}

export interface InstantiatedGroups {
  groups: WorkflowGroup[]
  /** New node id → new group id, for the copied members. */
  groupIdByNodeId: Map<string, string>
}

/**
 * Turns copied groups into new groups for a paste or a duplicate: each gets a
 * fresh id, keeps its label, color, size, and collapsed state, and is shifted
 * by `offset` together with its members. Members are re-pointed through
 * `nodeIdMap` (old node id → new node id); a member that was not copied is
 * simply not there.
 */
export function instantiateCopiedGroups(
  groups: readonly DomainWorkflowGroupDTO[],
  nodeIdMap: ReadonlyMap<string, string>,
  offset: XYPosition
): InstantiatedGroups {
  const groupIdByNodeId = new Map<string, string>()
  const instantiated = groups.map((group) => {
    const id = createGroupId()
    group.nodeIds.forEach((nodeId) => {
      const newNodeId = nodeIdMap.get(nodeId)
      if (newNodeId) groupIdByNodeId.set(newNodeId, id)
    })
    return {
      id,
      label: group.label,
      color: normalizeGroupColor(group.color),
      x: group.x + offset.x,
      y: group.y + offset.y,
      width: group.width,
      height: group.height,
      collapsed: group.collapsed,
    }
  })

  return { groups: instantiated, groupIdByNodeId }
}

/** Sets or clears `data.groupId` on new nodes from the instantiated groups. */
export function assignCopiedGroupIds(
  nodes: readonly WorkflowNode[],
  groupIdByNodeId: ReadonlyMap<string, string>
): WorkflowNode[] {
  return nodes.map((node) => {
    const groupId = groupIdByNodeId.get(node.id)
    if (groupId === node.data.groupId) return node
    return {
      ...node,
      data:
        groupId === undefined
          ? withoutGroupId(node.data)
          : { ...node.data, groupId },
    }
  })
}
