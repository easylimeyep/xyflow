import { decodeNodeConfig } from "../../node-registry/node-config-normalization"
import { isNodeKind } from "../../types/types"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowDTO,
  DomainWorkflowNodeDTO,
} from "../../types/types"
import { asRecord, isNumber, isString, isViewport } from "../utils/utils"

function toNodeDTO(
  value: unknown
): { success: true; value: DomainWorkflowNodeDTO } | { success: false; error: string } {
  const record = asRecord(value)
  if (!record) {
    return { success: false, error: "Workflow node must be an object." }
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
    return { success: false, error: "Workflow node must include valid id, kind, position, and label." }
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

export function toDomainDTO(
  value: unknown
): { success: true; value: DomainWorkflowDTO } | { success: false; error: string } {
  const record = asRecord(value)
  if (!record) {
    return { success: false, error: "JSON root must be an object." }
  }

  const viewport = record.viewport
  if (
    !isString(record.id) ||
    !isString(record.name) ||
    !isNumber(record.version) ||
    !asRecord(record.metadata) ||
    !Array.isArray(record.nodes) ||
    !Array.isArray(record.connections) ||
    !isViewport(viewport)
  ) {
    return {
      success: false,
      error: "Workflow JSON must match domain workflow schema.",
    }
  }

  const nodes = record.nodes.map(toNodeDTO)
  const connections = record.connections.map(toConnectionDTO)
  const nodeFailure = nodes.find((node) => !node.success)
  if (nodeFailure && !nodeFailure.success) {
    return { success: false, error: nodeFailure.error }
  }
  if (connections.some((connection) => connection === null)) {
    return { success: false, error: "Workflow JSON must match domain workflow schema." }
  }

  return {
    success: true,
    value: {
      id: record.id,
      name: record.name,
      version: record.version,
      metadata: record.metadata as DomainWorkflowDTO["metadata"],
      nodes: nodes
        .filter((node): node is { success: true; value: DomainWorkflowNodeDTO } => node.success)
        .map((node) => node.value),
      connections: connections.filter(
        (connection): connection is DomainWorkflowConnectionDTO => connection !== null
      ),
      viewport,
    },
  }
}
