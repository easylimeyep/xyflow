import type { Connection } from "@xyflow/react"

import { getAllowedTargets } from "../node-registry/node-graph-rules"
import type { NodeKind } from "../node-registry/registry"
import type { WorkflowEdge, WorkflowNode } from "../types/types"

const EVALUATOR_TRUE_HANDLE = "evaluator-true"
const EVALUATOR_FALSE_HANDLE = "evaluator-false"

export interface ValidationResult {
  valid: boolean
  reason?: string
}

export type ConnectionLike = Pick<Connection, "source" | "target"> & {
  sourceHandle?: string | null
  targetHandle?: string | null
}

export function validateConnection(
  connection: ConnectionLike,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationResult {
  if (!connection.source || !connection.target) {
    return {
      valid: false,
      reason: "Connection is missing source or target node.",
    }
  }

  const sourceNode = nodes.find((node) => node.id === connection.source)
  const targetNode = nodes.find((node) => node.id === connection.target)

  if (!sourceNode || !targetNode) {
    return {
      valid: false,
      reason: "Connection references an unknown node.",
    }
  }

  const sourceKind = sourceNode.data.kind as NodeKind
  const targetKind = targetNode.data.kind
  const allowedTargets = getAllowedTargets(sourceKind)

  if (
    sourceKind === "evaluator" &&
    connection.sourceHandle !== EVALUATOR_TRUE_HANDLE &&
    connection.sourceHandle !== EVALUATOR_FALSE_HANDLE
  ) {
    return {
      valid: false,
      reason:
        "Evaluator node connections must use a true or false output handle.",
    }
  }

  if (!allowedTargets.includes(targetKind)) {
    return {
      valid: false,
      reason: `${sourceKind} node cannot connect to ${targetKind} node.`,
    }
  }

  if (
    targetNode.data.kind === "inlineExpression" &&
    targetNode.data.config.isRoot === true
  ) {
    return {
      valid: false,
      reason: "Root Keyword node cannot accept incoming connections.",
    }
  }

  const duplicate = edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      edge.sourceHandle === (connection.sourceHandle ?? null) &&
      edge.targetHandle === (connection.targetHandle ?? null)
  )

  if (duplicate) {
    return {
      valid: false,
      reason: "Connection already exists.",
    }
  }

  if (
    sourceKind === "evaluator" &&
    edges.some(
      (edge) =>
        edge.source === connection.source &&
        edge.sourceHandle === (connection.sourceHandle ?? null)
    )
  ) {
    return {
      valid: false,
      reason: "Evaluator output already has an outgoing connection.",
    }
  }

  // Topology is intentionally unrestricted; cycles are valid as long as
  // structural guardrails (kinds/handles/duplicates/root constraints) pass.
  return { valid: true }
}

export function getKindsFromConnection(
  connection: ConnectionLike,
  nodes: WorkflowNode[]
): { sourceKind: string; targetKind: string } | null {
  if (!connection.source || !connection.target) {
    return null
  }

  const sourceNode = nodes.find((node) => node.id === connection.source)
  const targetNode = nodes.find((node) => node.id === connection.target)
  if (!sourceNode || !targetNode) {
    return null
  }

  return {
    sourceKind: sourceNode.data.kind,
    targetKind: targetNode.data.kind,
  }
}
