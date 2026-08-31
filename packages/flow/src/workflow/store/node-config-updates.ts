import { applyUpdateNodeConfigCommand } from "../graph-engine"
import type { NodeRegistry } from "../node-registry/registry"
import type { WorkflowError } from "../types/errors"
import type { WorkflowGraphState } from "../types/types"
import type { NodeConfigUpdate } from "./types"

interface NodeConfigUpdateResult {
  nextGraph: WorkflowGraphState | null
  error: WorkflowError | null
}

export function applyNodeConfigUpdate(
  registry: NodeRegistry,
  currentGraph: WorkflowGraphState,
  nodeId: string,
  update: NodeConfigUpdate
): NodeConfigUpdateResult {
  const result = applyUpdateNodeConfigCommand(registry, currentGraph, {
    nodeId,
    update,
  })
  return result.ok
    ? { nextGraph: result.nextGraph, error: null }
    : { nextGraph: null, error: result.error }
}
