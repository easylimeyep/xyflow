import { normalizeNodeConfig } from "../node-registry/node-config-normalization"
import type { NodeKind } from "../node-registry/registry"
import type {
  DomainWorkflowConnectionDTO,
  DomainWorkflowNodeDTO,
  WorkflowEdge,
  WorkflowNode,
} from "../types/types"
import type { ConnectionLike } from "../validation/validation"

export function asDomainNodeDTO(node: WorkflowNode): DomainWorkflowNodeDTO {
  return {
    id: node.id,
    kind: node.data.kind,
    position: { ...node.position },
    label: node.data.label,
    config: normalizeNodeConfig(node.data.kind as NodeKind, node.data.config),
  }
}

export function asDomainConnectionDTO(
  edge: WorkflowEdge
): DomainWorkflowConnectionDTO {
  return {
    id: edge.id,
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
  }
}

export function toEdgeConnectionWithKind(
  connection: ConnectionLike,
  sourceKind: string,
  targetKind: string
) {
  return {
    ...connection,
    sourceHandle: connection.sourceHandle ?? null,
    targetHandle: connection.targetHandle ?? null,
    data: {
      sourceKind,
      targetKind,
    },
  }
}
