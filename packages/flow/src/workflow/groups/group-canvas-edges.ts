import type { WorkflowEdge, WorkflowGroup, WorkflowNode } from "../types/types"

import { toGroupFrameId } from "./group-canvas-ids"
import {
  isGroupEffectivelyCollapsed,
  type CollapsedOverride,
} from "./group-canvas-nodes"

export const GROUP_PROXY_EDGE_ID_PREFIX = "group-proxy:"
/** The single input and output a collapsed card shows. */
export const GROUP_CARD_TARGET_HANDLE = "group-card-in"
export const GROUP_CARD_SOURCE_HANDLE = "group-card-out"

export function isGroupProxyEdge(edge: Pick<WorkflowEdge, "id">): boolean {
  return edge.id.startsWith(GROUP_PROXY_EDGE_ID_PREFIX)
}

/**
 * The edges the canvas draws while groups are collapsed. An edge inside one
 * collapsed group disappears; an edge crossing a collapsed group's boundary
 * is redrawn to its card as a read-only proxy; proxies that end up joining
 * the same two endpoints are merged. Store edges are never changed, and the
 * same array comes back when no group is collapsed.
 */
export function buildCanvasEdges(
  edges: WorkflowEdge[],
  nodes: readonly WorkflowNode[],
  groups: readonly WorkflowGroup[],
  collapsedOverride: CollapsedOverride
): WorkflowEdge[] {
  const collapsedGroupIds = new Set(
    groups
      .filter((group) => isGroupEffectivelyCollapsed(group, collapsedOverride))
      .map((group) => group.id)
  )
  if (collapsedGroupIds.size === 0) {
    return edges
  }

  const collapsedGroupByNodeId = new Map<string, string>()
  for (const node of nodes) {
    const { groupId } = node.data
    if (groupId !== undefined && collapsedGroupIds.has(groupId)) {
      collapsedGroupByNodeId.set(node.id, groupId)
    }
  }
  return projectEdgesToCards(edges, collapsedGroupByNodeId)
}

/** The edge projection, given which collapsed group hides each member. */
function projectEdgesToCards(
  edges: WorkflowEdge[],
  collapsedGroupByNodeId: ReadonlyMap<string, string>
): WorkflowEdge[] {
  if (collapsedGroupByNodeId.size === 0) {
    return edges
  }

  const result: WorkflowEdge[] = []
  const proxyKeys = new Set<string>()
  for (const edge of edges) {
    const sourceGroup = collapsedGroupByNodeId.get(edge.source)
    const targetGroup = collapsedGroupByNodeId.get(edge.target)
    if (!sourceGroup && !targetGroup) {
      result.push(edge)
      continue
    }
    if (sourceGroup !== undefined && sourceGroup === targetGroup) {
      continue
    }

    const source = sourceGroup ? toGroupFrameId(sourceGroup) : edge.source
    const target = targetGroup ? toGroupFrameId(targetGroup) : edge.target
    const sourceHandle = sourceGroup
      ? GROUP_CARD_SOURCE_HANDLE
      : (edge.sourceHandle ?? null)
    const targetHandle = targetGroup
      ? GROUP_CARD_TARGET_HANDLE
      : (edge.targetHandle ?? null)
    const key = `${source}\u0000${sourceHandle}\u0000${target}\u0000${targetHandle}`
    if (proxyKeys.has(key)) continue
    proxyKeys.add(key)

    result.push({
      ...edge,
      id: `${GROUP_PROXY_EDGE_ID_PREFIX}${edge.id}`,
      source,
      target,
      sourceHandle,
      targetHandle,
      selected: false,
      selectable: false,
      deletable: false,
    })
  }
  return result
}

export interface CollapsedMembership {
  groupId: string
  memberIds: readonly string[]
}

/**
 * {@link buildCanvasEdges} for the canvas, remembering its last answer: the
 * edges only change when the edges do or a collapsed group's membership does,
 * so a drag — which moves nodes but rarely changes either — reuses the same
 * edge objects instead of re-rendering every edge on every frame.
 *
 * `collapsed` lists each collapsed group with its member ids; the member id
 * arrays are expected to keep their identity while membership is unchanged
 * (the group node builder guarantees that).
 */
export function createCanvasEdgeBuilder() {
  let last: {
    edges: WorkflowEdge[]
    collapsed: readonly CollapsedMembership[]
    result: WorkflowEdge[]
  } | null = null

  return function buildMemoizedCanvasEdges(
    edges: WorkflowEdge[],
    collapsed: readonly CollapsedMembership[]
  ): WorkflowEdge[] {
    if (
      last &&
      last.edges === edges &&
      last.collapsed.length === collapsed.length &&
      last.collapsed.every(
        (entry, index) =>
          entry.groupId === collapsed[index]?.groupId &&
          entry.memberIds === collapsed[index]?.memberIds
      )
    ) {
      return last.result
    }

    const collapsedGroupByNodeId = new Map<string, string>()
    collapsed.forEach((entry) =>
      entry.memberIds.forEach((id) =>
        collapsedGroupByNodeId.set(id, entry.groupId)
      )
    )
    const result = projectEdgesToCards(edges, collapsedGroupByNodeId)
    last = { edges, collapsed, result }
    return result
  }
}
