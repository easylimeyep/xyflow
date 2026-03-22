import type { Viewport } from "@xyflow/react"

import { DEFAULT_VIEWPORT } from "./default-graph"
import {
  createWorkflowNode,
  isRecordJsonObject,
  normalizeNodeConfig,
} from "./node-registry"
import { isNodeKind } from "./types"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowDTO,
  DomainWorkflowNodeDTO,
  JsonObject,
  JsonValue,
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowNode,
} from "./types"

export interface ParseResult<T> {
  success: boolean
  value?: T
  error?: string
}

type UnknownRecord = Record<string, unknown>

function isString(value: unknown): value is string {
  return typeof value === "string"
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  return value as UnknownRecord
}

function toJsonObject(value: unknown): JsonObject | null {
  if (!isRecordJsonObject(value)) {
    return null
  }

  return value
}

function isViewport(value: unknown): value is Viewport {
  const record = asRecord(value)
  if (!record) {
    return false
  }

  return isNumber(record.x) && isNumber(record.y) && isNumber(record.zoom) && record.zoom > 0
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

function toJsonValue(value: unknown): JsonValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item))
  }

  const record = asRecord(value)
  if (!record) {
    return null
  }

  const result: JsonObject = {}
  Object.entries(record).forEach(([key, entryValue]) => {
    result[key] = toJsonValue(entryValue)
  })

  return result
}

function toJsonConfig(value: unknown): JsonObject {
  const jsonValue = toJsonValue(value)
  if (typeof jsonValue === "object" && jsonValue !== null && !Array.isArray(jsonValue)) {
    return jsonValue
  }

  return {}
}

export function internalToDomain(
  graph: WorkflowGraphState,
  workflowId = "workflow-local",
  workflowName = "Untitled Workflow"
): DomainWorkflowDTO {
  const nodes: DomainWorkflowNodeDTO[] = graph.nodes.map((node) => ({
    id: node.id,
    kind: node.data.kind,
    position: node.position,
    label: node.data.label,
    config: toJsonConfig(node.data.config),
  }))

  const connections: DomainWorkflowConnectionDTO[] = graph.edges.map((edge) => ({
    id: edge.id,
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
  }))

  return {
    id: workflowId,
    name: workflowName,
    version: 1,
    metadata: { source: "ui" },
    nodes,
    connections,
    viewport: graph.viewport,
  }
}

export function domainToInternal(dto: DomainWorkflowDTO): WorkflowGraphState {
  const nodes: WorkflowNode[] = dto.nodes.map((nodeDto: DomainWorkflowNodeDTO) => {
    const baseNode = createWorkflowNode(nodeDto.kind, nodeDto.position, nodeDto.label)
    baseNode.id = nodeDto.id
    baseNode.data = {
      kind: nodeDto.kind,
      label: nodeDto.label,
      config: normalizeNodeConfig(nodeDto.kind, nodeDto.config),
    }

    return baseNode
  })

  const nodeById = new Map(nodes.map((node: WorkflowNode) => [node.id, node]))
  const edges: WorkflowEdge[] = []
  dto.connections.forEach((connection: DomainWorkflowConnectionDTO) => {
    const sourceNode = nodeById.get(connection.sourceNodeId)
    const targetNode = nodeById.get(connection.targetNodeId)
    if (!sourceNode || !targetNode) {
      return
    }

    edges.push({
      id: connection.id,
      source: connection.sourceNodeId,
      target: connection.targetNodeId,
      sourceHandle: connection.sourceHandle ?? null,
      targetHandle: connection.targetHandle ?? null,
      data: {
        sourceKind: sourceNode.data.kind,
        targetKind: targetNode.data.kind,
      },
    })
  })

  return {
    nodes,
    edges,
    viewport: dto.viewport,
  }
}

export function exportInternalJson(graph: WorkflowGraphState): string {
  return JSON.stringify(graph, null, 2)
}

export function exportDomainJson(graph: WorkflowGraphState): string {
  return JSON.stringify(internalToDomain(graph), null, 2)
}

export function parseInternalGraphJson(rawJson: string): ParseResult<WorkflowGraphState> {
  try {
    const parsed: unknown = JSON.parse(rawJson)
    const parsedRecord = asRecord(parsed)
    if (!parsedRecord) {
      return {
        success: false,
        error: "JSON root must be an object.",
      }
    }

    const hasInternalShape =
      Array.isArray(parsedRecord.nodes) && Array.isArray(parsedRecord.edges)
    const hasDomainShape =
      Array.isArray(parsedRecord.nodes) && Array.isArray(parsedRecord.connections)

    if (!hasInternalShape && !hasDomainShape) {
      return {
        success: false,
        error:
          "Workflow JSON must contain nodes with either edges (internal) or connections (domain).",
      }
    }

    const domainDTO = normalizeGraphLikeValue(parsedRecord)
    if (!domainDTO) {
      return {
        success: false,
        error: "JSON does not match internal or domain workflow schema.",
      }
    }

    return {
      success: true,
      value: domainToInternal(domainDTO),
    }
  } catch {
    return {
      success: false,
      error: "Invalid JSON payload.",
    }
  }
}

function normalizeGraphLikeValue(value: UnknownRecord): DomainWorkflowDTO | null {
  if (Array.isArray(value.nodes) && Array.isArray(value.connections)) {
    return toDomainDTO(value)
  }

  if (Array.isArray(value.nodes) && Array.isArray(value.edges)) {
    return internalGraphToDomainLike(value)
  }

  return null
}

function toDomainDTO(value: UnknownRecord): DomainWorkflowDTO | null {
  const viewport = value.viewport
  if (
    !isString(value.id) ||
    !isString(value.name) ||
    !isNumber(value.version) ||
    !isRecordJsonObject(value.metadata) ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.connections) ||
    !isViewport(viewport)
  ) {
    return null
  }

  const nodes = value.nodes.map(toNodeDTO)
  const connections = value.connections.map(toConnectionDTO)
  if (nodes.some((node) => node === null) || connections.some((connection) => connection === null)) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    version: value.version,
    metadata: { source: "ui" },
    nodes: nodes.filter((node): node is DomainWorkflowNodeDTO => node !== null),
    connections: connections.filter(
      (connection): connection is DomainWorkflowConnectionDTO => connection !== null
    ),
    viewport,
  }
}

function internalGraphToDomainLike(value: UnknownRecord): DomainWorkflowDTO | null {
  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return null
  }

  const nodes: DomainWorkflowNodeDTO[] = []
  for (const rawNode of value.nodes) {
    const nodeRecord = asRecord(rawNode)
    if (!nodeRecord) {
      return null
    }

    const position = asRecord(nodeRecord.position)
    const data = asRecord(nodeRecord.data)
    const config = data ? asRecord(data.config) : null
    if (
      !isString(nodeRecord.id) ||
      !isNodeKind(nodeRecord.type) ||
      !position ||
      !isNumber(position.x) ||
      !isNumber(position.y) ||
      !data ||
      !isString(data.label) ||
      !config
    ) {
      return null
    }

    nodes.push({
      id: nodeRecord.id,
      kind: nodeRecord.type,
      position: { x: position.x, y: position.y },
      label: data.label,
      config: toJsonConfig(config),
    })
  }

  const connections: DomainWorkflowConnectionDTO[] = []
  for (const rawEdge of value.edges) {
    const edgeRecord = asRecord(rawEdge)
    if (!edgeRecord) {
      return null
    }

    const sourceHandle = edgeRecord.sourceHandle
    const targetHandle = edgeRecord.targetHandle
    if (
      !isString(edgeRecord.id) ||
      !isString(edgeRecord.source) ||
      !isString(edgeRecord.target) ||
      !(
        sourceHandle === undefined ||
        sourceHandle === null ||
        typeof sourceHandle === "string"
      ) ||
      !(
        targetHandle === undefined ||
        targetHandle === null ||
        typeof targetHandle === "string"
      )
    ) {
      return null
    }

    connections.push({
      id: edgeRecord.id,
      sourceNodeId: edgeRecord.source,
      targetNodeId: edgeRecord.target,
      sourceHandle: sourceHandle ?? null,
      targetHandle: targetHandle ?? null,
    })
  }

  return {
    id: "workflow-imported",
    name: "Imported Workflow",
    version: 1,
    metadata: { source: "ui" },
    nodes,
    connections,
    viewport: isViewport(value.viewport) ? value.viewport : DEFAULT_VIEWPORT,
  }
}

export function isValidDomainDto(value: unknown): value is DomainWorkflowDTO {
  if (!isRecordJsonObject(value)) {
    return false
  }

  return toDomainDTO(value) !== null
}

export function sanitizeConfigValue(value: JsonValue): JsonValue {
  return value
}
