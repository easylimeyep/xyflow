import { isRecordJsonObject } from "../node-registry"
import { isNodeKind } from "../types"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowDTO,
  DomainWorkflowNodeDTO,
  JsonObject,
} from "../types"
import { asRecord, isNumber, isString, isViewport } from "./utils"

function toJsonObject(value: unknown): JsonObject | null {
  if (!isRecordJsonObject(value)) {
    return null
  }

  return value
}

function toNodeDTO(value: unknown): DomainWorkflowNodeDTO | null {
  const record = asRecord(value)
  if (!record) {
    return null
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
    return null
  }

  const config = toJsonObject(record.config)
  if (!config) {
    return null
  }

  return {
    id: record.id,
    kind: record.kind,
    position: { x: position.x, y: position.y },
    label: record.label,
    config,
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

export function toDomainDTO(value: unknown): DomainWorkflowDTO | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const viewport = record.viewport
  if (
    !isString(record.id) ||
    !isString(record.name) ||
    !isNumber(record.version) ||
    !isRecordJsonObject(record.metadata) ||
    !Array.isArray(record.nodes) ||
    !Array.isArray(record.connections) ||
    !isViewport(viewport)
  ) {
    return null
  }

  const nodes = record.nodes.map(toNodeDTO)
  const connections = record.connections.map(toConnectionDTO)
  if (nodes.some((node) => node === null) || connections.some((connection) => connection === null)) {
    return null
  }

  return {
    id: record.id,
    name: record.name,
    version: record.version,
    metadata: record.metadata,
    nodes: nodes.filter((node): node is DomainWorkflowNodeDTO => node !== null),
    connections: connections.filter(
      (connection): connection is DomainWorkflowConnectionDTO => connection !== null
    ),
    viewport,
  }
}
