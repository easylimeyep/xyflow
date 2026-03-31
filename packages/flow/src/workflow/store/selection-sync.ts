import type { WorkflowNode } from "../types/types"

export function projectSelectionToNodes(
  nodes: WorkflowNode[],
  selectedNodeIds: string[]
): WorkflowNode[] {
  const selectedNodeIdSet = new Set(selectedNodeIds)
  let changed = false
  const nextNodes = nodes.map((node) => {
    const shouldBeSelected = selectedNodeIdSet.has(node.id)
    if (Boolean(node.selected) === shouldBeSelected) {
      return node
    }
    changed = true
    return {
      ...node,
      selected: shouldBeSelected,
    }
  })

  return changed ? nextNodes : nodes
}
