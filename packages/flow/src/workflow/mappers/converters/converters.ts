import { normalizeNodeConfig } from "../../node-registry/node-config-normalization"
import { createWorkflowNode } from "../../node-registry/node-factory"
import type { NodeKind, NodeRegistry } from "../../node-registry/registry"
import { normalizeGroupColor } from "../../groups/group-colors"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowDTO,
  DomainWorkflowGroupDTO,
  DomainWorkflowNodeDTO,
  WorkflowEdge,
  WorkflowGraphState,
  WorkflowGroup,
  WorkflowNode,
} from "../../types/types"
import { normalizeDomainMetadata, toJsonConfig } from "../utils/utils"

export function internalToDomain(
  registry: NodeRegistry,
  graph: WorkflowGraphState,
  workflowId = graph.document.id,
  workflowName = graph.document.name
): DomainWorkflowDTO {
  const nodes: DomainWorkflowNodeDTO[] = graph.nodes.map((node) => ({
    id: node.id,
    kind: node.data.kind,
    position: node.position,
    label: node.data.label,
    config: normalizeNodeConfig(
      registry,
      node.data.kind as NodeKind,
      toJsonConfig(node.data.config)
    ),
  }))

  const connections: DomainWorkflowConnectionDTO[] = graph.edges.map(
    (edge) => ({
      id: edge.id,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      sourceHandle: edge.sourceHandle ?? null,
      targetHandle: edge.targetHandle ?? null,
    })
  )

  return {
    id: workflowId,
    name: workflowName,
    version: graph.document.version,
    metadata: normalizeDomainMetadata(graph.document.metadata),
    nodes,
    connections,
    groups: toDomainGroups(graph),
    viewport: graph.viewport,
  }
}

/**
 * Turns per-node `data.groupId` into each group's `nodeIds`, sorted so the same
 * membership always exports the same way: membership has no order.
 */
export function toDomainGroups(
  graph: Pick<WorkflowGraphState, "nodes" | "groups">
): DomainWorkflowGroupDTO[] {
  const memberIdsByGroupId = new Map<string, string[]>()
  graph.nodes.forEach((node) => {
    const { groupId } = node.data
    if (groupId === undefined) return
    const memberIds = memberIdsByGroupId.get(groupId) ?? []
    memberIds.push(node.id)
    memberIdsByGroupId.set(groupId, memberIds)
  })

  return graph.groups.map((group) => ({
    id: group.id,
    label: group.label,
    color: group.color,
    x: group.x,
    y: group.y,
    width: group.width,
    height: group.height,
    collapsed: group.collapsed,
    nodeIds: (memberIdsByGroupId.get(group.id) ?? []).sort(),
  }))
}

function toInternalGroup(dto: DomainWorkflowGroupDTO): WorkflowGroup {
  return {
    id: dto.id,
    label: dto.label,
    color: normalizeGroupColor(dto.color),
    x: dto.x,
    y: dto.y,
    width: dto.width,
    height: dto.height,
    collapsed: dto.collapsed,
  }
}

export function domainToInternal(
  registry: NodeRegistry,
  dto: DomainWorkflowDTO
): WorkflowGraphState {
  const domainGroups = dto.groups ?? []
  const groupIdByNodeId = new Map<string, string>()
  domainGroups.forEach((group) => {
    group.nodeIds.forEach((nodeId) => groupIdByNodeId.set(nodeId, group.id))
  })

  const nodes: WorkflowNode[] = dto.nodes.map(
    (nodeDto: DomainWorkflowNodeDTO) => {
      const baseNode = createWorkflowNode(
        registry,
        nodeDto.kind as NodeKind,
        nodeDto.position,
        nodeDto.label
      )
      baseNode.id = nodeDto.id
      const groupId = groupIdByNodeId.get(nodeDto.id)
      baseNode.data = {
        kind: nodeDto.kind,
        label: nodeDto.label,
        config: normalizeNodeConfig(
          registry,
          nodeDto.kind as NodeKind,
          nodeDto.config
        ),
        ...(groupId === undefined ? {} : { groupId }),
      }

      return baseNode
    }
  )

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
    groups: domainGroups.map(toInternalGroup),
    viewport: dto.viewport,
    document: {
      id: dto.id,
      name: dto.name,
      version: dto.version,
      metadata: normalizeDomainMetadata(dto.metadata),
    },
  }
}

export function exportDomainDto(
  registry: NodeRegistry,
  graph: WorkflowGraphState
): DomainWorkflowDTO {
  return internalToDomain(registry, graph)
}

export function exportDomainJson(
  registry: NodeRegistry,
  graph: WorkflowGraphState
): string {
  return JSON.stringify(exportDomainDto(registry, graph), null, 2)
}
