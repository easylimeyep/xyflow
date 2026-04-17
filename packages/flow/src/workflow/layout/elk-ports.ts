import { getNodeDefinition, type NodeKind } from "../node-registry/registry"
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
    return handleId ? `${nodeId}::${INPUT_PORT_SUFFIX}::${handleId}` : `${nodeId}::${INPUT_PORT_SUFFIX}`
  }
  return handleId ? `${nodeId}::${OUTPUT_PORT_SUFFIX}::${handleId}` : `${nodeId}::${OUTPUT_PORT_SUFFIX}`
}

function resolveDefaultOutputHandles(node: WorkflowNode): WorkflowLayoutHandle[] {
  const kind = node.data.kind as NodeKind
  const definition = getNodeDefinition(kind)

  if (kind === "result") {
    return []
  }

  if (definition.outputs) {
    return definition.outputs.map((handle) => ({ id: handle.id ?? null }))
  }

  return [{ id: null }]
}

export function resolveWorkflowLayoutPorts(node: WorkflowNode): WorkflowLayoutPorts {
  const kind = node.data.kind as NodeKind
  const hasTargetPort =
    kind === "inlineExpression" ? node.data.config.isRoot !== true : true

  return {
    hasTargetPort,
    outputHandles: resolveDefaultOutputHandles(node),
  }
}
