import type { XYPosition } from "@xyflow/react"

import { decodeNodeConfig } from "../../node-registry/node-config-normalization"
import { isNodeKind } from "../../types/types"
import type { DomainWorkflowConnectionDTO, DomainWorkflowNodeDTO } from "../../types/types"
import type { ParseResult } from "../parser/parser"
import { asRecord, isNumber, isString } from "../utils/utils"

export const WORKFLOW_SELECTION_CLIPBOARD_KIND = "workflow-selection-v1"

export interface WorkflowSelectionClipboardPayload {
  kind: typeof WORKFLOW_SELECTION_CLIPBOARD_KIND
  nodes: DomainWorkflowNodeDTO[]
  connections: DomainWorkflowConnectionDTO[]
}

function toNodeDTO(
  value: unknown
): { success: true; value: DomainWorkflowNodeDTO } | { success: false; error: string } {
  const record = asRecord(value)
  if (!record) {
    return { success: false, error: "Clipboard node must be an object." }
  }

  const position = asRecord(record.position)
  if (
    !isString(record.id) ||
    !isNodeKind(record.kind) ||
    !position ||
    !isNumber(position.x) ||
    !isNumber(position.y) ||
    !isString(record.label)
  ) {
    return { success: false, error: "Clipboard node must include valid id, kind, position, and label." }
  }

  const configResult = decodeNodeConfig(record.kind, record.config)
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

function createRelativeNodes(nodes: DomainWorkflowNodeDTO[]): DomainWorkflowNodeDTO[] {
  if (nodes.length === 0) {
    return []
  }

  const anchor = nodes.reduce<XYPosition>(
    (acc, node) => ({
      x: Math.min(acc.x, node.position.x),
      y: Math.min(acc.y, node.position.y),
    }),
    { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY }
  )

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x - anchor.x,
      y: node.position.y - anchor.y,
    },
  }))
}

export function exportSelectionClipboardJson(
  selectedNodes: DomainWorkflowNodeDTO[],
  selectedConnections: DomainWorkflowConnectionDTO[]
): string {
  const selectedNodeIds = new Set(selectedNodes.map((node) => node.id))
  const normalizedNodes = createRelativeNodes(selectedNodes)
  const normalizedConnections = selectedConnections.filter(
    (connection) =>
      selectedNodeIds.has(connection.sourceNodeId) && selectedNodeIds.has(connection.targetNodeId)
  )
  const payload: WorkflowSelectionClipboardPayload = {
    kind: WORKFLOW_SELECTION_CLIPBOARD_KIND,
    nodes: normalizedNodes,
    connections: normalizedConnections,
  }

  return JSON.stringify(payload, null, 2)
}

export function parseSelectionClipboardJson(
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

    const nodes = record.nodes.map(toNodeDTO)
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
      .filter((node): node is { success: true; value: DomainWorkflowNodeDTO } => node.success)
      .map((node) => node.value)
    const nodeIds = new Set(decodedNodes.map((node) => node.id))
    const hasExternalReferences = connections
      .filter((connection): connection is DomainWorkflowConnectionDTO => connection !== null)
      .some(
        (connection) =>
          !nodeIds.has(connection.sourceNodeId) || !nodeIds.has(connection.targetNodeId)
      )
    if (hasExternalReferences) {
      return {
        success: false,
        error: "Clipboard JSON contains connections outside copied selection.",
      }
    }

    return {
      success: true,
      value: {
        kind: WORKFLOW_SELECTION_CLIPBOARD_KIND,
        nodes: decodedNodes,
        connections: connections.filter(
          (connection): connection is DomainWorkflowConnectionDTO => connection !== null
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
