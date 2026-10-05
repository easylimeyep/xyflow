import type {
  BackendWorkflowDTO,
  BackendWorkflowGroupDTO,
  DomainWorkflowGroupDTO,
} from "../../types/types"

/**
 * Maps domain groups onto the backend's numeric node ids, sorted ascending so
 * output stays deterministic. A member without a backend id is left out rather
 * than failing the export: groups must never make a workflow non-exportable.
 */
export function toBackendGroups(
  groups: readonly DomainWorkflowGroupDTO[],
  backendIdByDomainId: ReadonlyMap<string, number>
): BackendWorkflowGroupDTO[] {
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    color: group.color,
    x: group.x,
    y: group.y,
    width: group.width,
    height: group.height,
    collapsed: group.collapsed,
    nodeIds: group.nodeIds
      .map((nodeId) => backendIdByDomainId.get(nodeId))
      .filter((backendId): backendId is number => backendId !== undefined)
      .sort((left, right) => left - right),
  }))
}

/**
 * The one place that decides where groups sit in the backend payload: a
 * top-level `groups` field beside `nodes`.
 */
export function attachBackendGroups(
  dto: Omit<BackendWorkflowDTO, "groups">,
  groups: BackendWorkflowGroupDTO[]
): BackendWorkflowDTO {
  return { ...dto, groups }
}
