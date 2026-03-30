import { useCallback, useRef } from "react"
import type { NodeChange } from "@xyflow/react"

import type { WorkflowNode } from "../../types"

interface UseNodeChangeRouterOptions {
  nodes: WorkflowNode[]
  onStructuralChanges: (changes: NodeChange<WorkflowNode>[]) => void
  onSelectionChange: (nodeIds: string[]) => void
}

/**
 * Separates ReactFlow's unified NodeChange stream into two channels:
 * structural changes (position, add, remove, dimensions) and selection changes.
 *
 * ReactFlow emits selection as NodeChange events, but our store manages
 * selection state independently. This hook routes each change type to
 * the appropriate handler without leaking ReactFlow's change model
 * into the store layer.
 */
export function useNodeChangeRouter({
  nodes,
  onStructuralChanges,
  onSelectionChange,
}: UseNodeChangeRouterOptions) {
  const lastSelectionSignatureRef = useRef<string | null>(null)

  const emitSelection = useCallback(
    (nodeIds: string[]) => {
      const nextSignature = [...nodeIds].sort().join("\u0000")
      if (nextSignature === lastSelectionSignatureRef.current) {
        return
      }

      lastSelectionSignatureRef.current = nextSignature
      onSelectionChange(nodeIds)
    },
    [onSelectionChange]
  )

  return useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      const nonSelectionChanges: NodeChange<WorkflowNode>[] = []
      let nextSelectedNodeIdsSet: Set<string> | null = null

      changes.forEach((change) => {
        if (change.type !== "select") {
          nonSelectionChanges.push(change)
          return
        }

        if (!nextSelectedNodeIdsSet) {
          nextSelectedNodeIdsSet = new Set(
            nodes.filter((node) => Boolean(node.selected)).map((node) => node.id)
          )
        }

        if (change.selected) {
          nextSelectedNodeIdsSet.add(change.id)
          return
        }
        nextSelectedNodeIdsSet.delete(change.id)
      })

      if (nextSelectedNodeIdsSet) {
        emitSelection([...nextSelectedNodeIdsSet])
      }

      if (nonSelectionChanges.length > 0) {
        onStructuralChanges(nonSelectionChanges)
      }
    },
    [emitSelection, nodes, onStructuralChanges]
  )
}
