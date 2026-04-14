import type { XYPosition } from "@xyflow/react"

import { createWorkflowNode } from "../node-registry/node-factory"
import type { NodeKind } from "../node-registry/registry"
import { isValidJsIdentifier } from "../expression/variable-name/variable-name"
import { createWorkflowError, type WorkflowError } from "../types/errors"
import type { WorkflowNode } from "../types/types"
import { createUniqueJsIdentifier, createUniqueLabel } from "../store/naming"

const VARIABLE_LABEL_KINDS = new Set<NodeKind>(["extractor", "setVariable"])

export function isVariableLabelKind(kind: NodeKind): boolean {
  return VARIABLE_LABEL_KINDS.has(kind)
}

export function createNodeWithUniqueLabel(
  currentNodes: WorkflowNode[],
  kind: NodeKind,
  position: XYPosition,
  nodeId?: string
): WorkflowNode {
  const nextNode = createWorkflowNode(kind, position)
  const usedLabels = new Set(
    currentNodes
      .map((node) => node.data.label.trim())
      .filter((label) => label.length > 0)
  )
  const uniqueLabel = isVariableLabelKind(kind)
    ? createUniqueJsIdentifier(nextNode.data.label, usedLabels)
    : createUniqueLabel(nextNode.data.label, usedLabels)

  if (uniqueLabel === nextNode.data.label) {
    return nodeId ? { ...nextNode, id: nodeId } : nextNode
  }

  return {
    ...nextNode,
    id: nodeId ?? nextNode.id,
    data: {
      ...nextNode.data,
      label: uniqueLabel,
    },
  }
}

export function resolveNodeLabelUpdate(
  currentNodes: WorkflowNode[],
  nodeId: string,
  nextLabel: string
): { nextLabel: string | null; error: WorkflowError | null } {
  const targetNode = currentNodes.find((node) => node.id === nodeId)
  if (!targetNode) {
    return { nextLabel: null, error: null }
  }

  const normalizedLabel = nextLabel.trim() || targetNode.data.label.trim() || "Node"
  const kind = targetNode.data.kind as NodeKind

  if (isVariableLabelKind(kind) && !isValidJsIdentifier(normalizedLabel)) {
    return {
      nextLabel: null,
      error: createWorkflowError(
        "INVALID_VARIABLE_NAME",
        "Node label must be a valid JavaScript identifier (no spaces or special characters)."
      ),
    }
  }

  const usedLabels = new Set(
    currentNodes
      .filter((node) => node.id !== nodeId)
      .map((node) => node.data.label.trim())
      .filter((label) => label.length > 0)
  )
  const uniqueLabel = isVariableLabelKind(kind)
    ? createUniqueJsIdentifier(normalizedLabel, usedLabels)
    : createUniqueLabel(normalizedLabel, usedLabels)

  return { nextLabel: uniqueLabel, error: null }
}
