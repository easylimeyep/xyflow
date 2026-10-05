import { normalizeGroupColor } from "../../groups/group-colors"
import type { DomainWorkflowGroupDTO } from "../../types/types"
import { asRecord, isNumber, isString } from "../utils/utils"

type DecodeResult<T> =
  | { success: true; value: T }
  | { success: false; error: string }

const INVALID_GROUP_ERROR =
  "Workflow group must include valid id, label, color, x, y, width, height, collapsed, and nodeIds."

function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function toGroupDTO(value: unknown): DomainWorkflowGroupDTO | null {
  const record = asRecord(value)
  if (
    !record ||
    !isString(record.id) ||
    !isString(record.label) ||
    record.label.trim() === "" ||
    !isString(record.color) ||
    !isNumber(record.x) ||
    !isNumber(record.y) ||
    !isPositiveNumber(record.width) ||
    !isPositiveNumber(record.height) ||
    typeof record.collapsed !== "boolean" ||
    !isStringArray(record.nodeIds)
  ) {
    return null
  }

  return {
    id: record.id,
    label: record.label,
    color: normalizeGroupColor(record.color),
    x: record.x,
    y: record.y,
    width: record.width,
    height: record.height,
    collapsed: record.collapsed,
    nodeIds: [...record.nodeIds],
  }
}

/**
 * Decodes the `groups` field of domain JSON. A missing field reads as no
 * groups. Every group must be well-formed, reference only existing nodes, and
 * no node may belong to two groups; an unknown color is normalized, not
 * rejected.
 */
export function decodeDomainGroups(
  value: unknown,
  nodeIds: ReadonlySet<string>
): DecodeResult<DomainWorkflowGroupDTO[]> {
  if (value === undefined) {
    return { success: true, value: [] }
  }
  if (!Array.isArray(value)) {
    return { success: false, error: "Workflow groups must be an array." }
  }

  const groups: DomainWorkflowGroupDTO[] = []
  const groupIds = new Set<string>()
  const memberNodeIds = new Set<string>()
  for (const entry of value) {
    const group = toGroupDTO(entry)
    if (!group) {
      return { success: false, error: INVALID_GROUP_ERROR }
    }
    if (groupIds.has(group.id)) {
      return {
        success: false,
        error: `Workflow group id "${group.id}" is used more than once.`,
      }
    }
    groupIds.add(group.id)

    for (const nodeId of group.nodeIds) {
      if (!nodeIds.has(nodeId)) {
        return {
          success: false,
          error: `Workflow group "${group.id}" references unknown node "${nodeId}".`,
        }
      }
      if (memberNodeIds.has(nodeId)) {
        return {
          success: false,
          error: `Workflow node "${nodeId}" belongs to more than one group.`,
        }
      }
      memberNodeIds.add(nodeId)
    }
    groups.push(group)
  }

  return { success: true, value: groups }
}
