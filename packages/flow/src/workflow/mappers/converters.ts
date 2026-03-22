import { createWorkflowNode, normalizeNodeConfig } from "../node-registry"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowDTO,
  DomainWorkflowNodeDTO,
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowNode,
} from "../types"
import { normalizeDomainMetadata, toJsonConfig } from "./utils"

export function internalToDomain(
  graph: WorkflowGraphState,
  workflowId = graph.document.id,
  workflowName = graph.document.name
): DomainWorkflowDTO {
  const nodes: DomainWorkflowNodeDTO[] = graph.nodes.map((node) => ({
    id: node.id,
    kind: node.data.kind,
    position: node.position,
    label: node.data.label,
    config: normalizeNodeConfig(node.data.kind, toJsonConfig(node.data.config)),
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
    version: graph.document.version,
    metadata: normalizeDomainMetadata(graph.document.metadata),
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
    document: {
      id: dto.id,
      name: dto.name,
      version: dto.version,
      metadata: normalizeDomainMetadata(dto.metadata),
    },
  }
}

export function exportInternalJson(graph: WorkflowGraphState): string {
  return JSON.stringify(graph, null, 2)
}

export function exportDomainJson(graph: WorkflowGraphState): string {
  return JSON.stringify(internalToDomain(graph), null, 2)
}
