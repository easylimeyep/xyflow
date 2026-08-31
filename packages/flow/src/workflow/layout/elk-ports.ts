import type { NodeKind, NodeRegistry } from "../node-registry/registry"
import type { WorkflowNode } from "../types/types"

export interface WorkflowLayoutHandle {
  id: string | null
}

export interface WorkflowLayoutPorts {
  hasTargetPort: boolean
  outputHandles: WorkflowLayoutHandle[]
}

const INPUT_PORT_SUFFIX = "target"
const OUTPUT_PORT_SUFFIX = "source"

export function getElkPortId(
  nodeId: string,
  kind: "target" | "source",
  handleId: string | null
): string {
  if (kind === "target") {
    return handleId
      ? `${nodeId}::${INPUT_PORT_SUFFIX}::${handleId}`
      : `${nodeId}::${INPUT_PORT_SUFFIX}`
  }
  return handleId
    ? `${nodeId}::${OUTPUT_PORT_SUFFIX}::${handleId}`
    : `${nodeId}::${OUTPUT_PORT_SUFFIX}`
}

function resolveDefaultOutputHandles(
  registry: NodeRegistry,
  node: WorkflowNode
): WorkflowLayoutHandle[] {
  const kind = node.data.kind as NodeKind
  const definition = registry.get(kind)

  if (kind === "result") {
    return []
  }

  // An unregistered kind lays out with a single default output handle.
  if (definition?.outputs) {
    return definition.outputs.map((handle) => ({ id: handle.id ?? null }))
  }

  return [{ id: null }]
}

export function resolveWorkflowLayoutPorts(
  registry: NodeRegistry,
  node: WorkflowNode
): WorkflowLayoutPorts {
  const kind = node.data.kind as NodeKind
  const hasTargetPort =
    kind === "inlineExpression" ? node.data.config.isRoot !== true : true

  return {
    hasTargetPort,
    outputHandles: resolveDefaultOutputHandles(registry, node),
  }
}
