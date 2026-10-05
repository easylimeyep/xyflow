import type { XYPosition } from "@xyflow/react"

import { decodeNodeConfig } from "../../node-registry/node-config-normalization"
import type { NodeRegistry } from "../../node-registry/registry"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowGroupDTO,
  DomainWorkflowNodeDTO,
} from "../../types/types"
import { decodeDomainGroups } from "../domain-dto/domain-groups"
import type { ParseResult } from "../parser/parser"
import { asRecord, isNumber, isString } from "../utils/utils"

export const WORKFLOW_SELECTION_CLIPBOARD_KIND = "workflow-selection-v1"

export interface WorkflowSelectionClipboardPayload {
  kind: typeof WORKFLOW_SELECTION_CLIPBOARD_KIND
  nodes: DomainWorkflowNodeDTO[]
  connections: DomainWorkflowConnectionDTO[]
  /**
   * Whole groups that were copied, with their rectangle and collapsed state.
   * `nodeIds` reference copied nodes only. Absent in payloads written before
   * groups existed.
   */
  groups?: DomainWorkflowGroupDTO[]
}

function toNodeDTO(
  registry: NodeRegistry,
  value: unknown
):
  | { success: true; value: DomainWorkflowNodeDTO }
  | { success: false; error: string } {
  const record = asRecord(value)
  if (!record) {
    return { success: false, error: "Clipboard node must be an object." }
  }

  const position = asRecord(record.position)
  if (
    !isString(record.id) ||
    !isString(record.kind) ||
    !registry.has(record.kind) ||
    !position ||
    !isNumber(position.x) ||
    !isNumber(position.y) ||
    !isString(record.label)
  ) {
    return {
      success: false,
      error: "Clipboard node must include valid id, kind, position, and label.",
    }
  }

  const configResult = decodeNodeConfig(registry, record.kind, record.config)
  if (!configResult.success) {
    return { success: false, error: configResult.error }
  }

  return {
    success: true,
    value: {
      id: record.id,
      kind: record.kind,
      position: { x: position.x, y: position.y },
      label: record.label,
      config: configResult.config,
    },
  }
}

function toConnectionDTO(value: unknown): DomainWorkflowConnectionDTO | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const sourceHandle = record.sourceHandle
  const targetHandle = record.targetHandle
  const isHandleValid = (handle: unknown): handle is string | null =>
    handle === null || isString(handle)

  if (
    !isString(record.id) ||
    !isString(record.sourceNodeId) ||
    !isString(record.targetNodeId) ||
    !isHandleValid(sourceHandle) ||
    !isHandleValid(targetHandle)
  ) {
    return null
  }

  return {
    id: record.id,
    sourceNodeId: record.sourceNodeId,
    targetNodeId: record.targetNodeId,
    sourceHandle,
    targetHandle,
  }
}

/**
 * The top-left corner of everything copied — nodes and group rectangles — so
 * positions in the payload are relative to it and paste can place the
 * selection anywhere without changing its shape.
 */
function getSelectionAnchor(
  nodes: DomainWorkflowNodeDTO[],
  groups: DomainWorkflowGroupDTO[]
): XYPosition {
  const corners = [
    ...nodes.map((node) => node.position),
    ...groups.map((group) => ({ x: group.x, y: group.y })),
  ]
  return corners.reduce<XYPosition>(
    (acc, corner) => ({
      x: Math.min(acc.x, corner.x),
      y: Math.min(acc.y, corner.y),
    }),
    { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY }
  )
}

export function exportSelectionClipboardJson(
  selectedNodes: DomainWorkflowNodeDTO[],
  selectedConnections: DomainWorkflowConnectionDTO[],
  selectedGroups: DomainWorkflowGroupDTO[] = []
): string {
  const selectedNodeIds = new Set(selectedNodes.map((node) => node.id))
  const anchor = getSelectionAnchor(selectedNodes, selectedGroups)
  const normalizedNodes = selectedNodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x - anchor.x,
      y: node.position.y - anchor.y,
    },
  }))
  const normalizedConnections = selectedConnections.filter(
    (connection) =>
      selectedNodeIds.has(connection.sourceNodeId) &&
      selectedNodeIds.has(connection.targetNodeId)
  )
  const normalizedGroups = selectedGroups.map((group) => ({
    ...group,
    x: group.x - anchor.x,
    y: group.y - anchor.y,
    nodeIds: group.nodeIds.filter((nodeId) => selectedNodeIds.has(nodeId)),
  }))
  const payload: WorkflowSelectionClipboardPayload = {
    kind: WORKFLOW_SELECTION_CLIPBOARD_KIND,
    nodes: normalizedNodes,
    connections: normalizedConnections,
    groups: normalizedGroups,
  }

  return JSON.stringify(payload, null, 2)
}

export function parseSelectionClipboardJson(
  registry: NodeRegistry,
  rawJson: string
): ParseResult<WorkflowSelectionClipboardPayload> {
  try {
    const parsed: unknown = JSON.parse(rawJson)
    const record = asRecord(parsed)
    if (!record) {
      return {
        success: false,
        error: "JSON root must be an object.",
      }
    }

    if (
      record.kind !== WORKFLOW_SELECTION_CLIPBOARD_KIND ||
      !Array.isArray(record.nodes) ||
      !Array.isArray(record.connections)
    ) {
      return {
        success: false,
        error: "Clipboard JSON must match workflow selection schema.",
      }
    }

    const nodes = record.nodes.map((node) => toNodeDTO(registry, node))
    const connections = record.connections.map(toConnectionDTO)
    const nodeFailure = nodes.find((node) => !node.success)
    if (nodeFailure && !nodeFailure.success) {
      return {
        success: false,
        error: nodeFailure.error,
      }
    }
    if (connections.some((connection) => connection === null)) {
      return {
        success: false,
        error: "Clipboard JSON must match workflow selection schema.",
      }
    }

    const decodedNodes = nodes
      .filter(
        (node): node is { success: true; value: DomainWorkflowNodeDTO } =>
          node.success
      )
      .map((node) => node.value)
    const nodeIds = new Set(decodedNodes.map((node) => node.id))
    const hasExternalReferences = connections
      .filter(
        (connection): connection is DomainWorkflowConnectionDTO =>
          connection !== null
      )
      .some(
        (connection) =>
          !nodeIds.has(connection.sourceNodeId) ||
          !nodeIds.has(connection.targetNodeId)
      )
    if (hasExternalReferences) {
      return {
        success: false,
        error: "Clipboard JSON contains connections outside copied selection.",
      }
    }

    const groups = decodeDomainGroups(record.groups, nodeIds)
    if (!groups.success) {
      return { success: false, error: groups.error }
    }

    return {
      success: true,
      value: {
        kind: WORKFLOW_SELECTION_CLIPBOARD_KIND,
        nodes: decodedNodes,
        groups: groups.value,
        connections: connections.filter(
          (connection): connection is DomainWorkflowConnectionDTO =>
            connection !== null
        ),
      },
    }
  } catch {
    return {
      success: false,
      error: "Invalid JSON payload.",
    }
  }
}
