import { useCallback, useEffect, useRef } from "react"
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
  const nodesRef = useRef(nodes)

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  // Compared against the selection the nodes carry now, not against the last
  // selection this router emitted: the store also changes the selection on
  // its own (delete, duplicate, paste, undo), and a remembered signature would
  // then swallow a click that re-selects the same node.
  const emitSelection = useCallback(
    (nodeIds: string[], currentNodeIds: ReadonlySet<string>) => {
      const isUnchanged =
        nodeIds.length === currentNodeIds.size &&
        nodeIds.every((nodeId) => currentNodeIds.has(nodeId))
      if (isUnchanged) {
        return
      }

      onSelectionChange(nodeIds)
    },
    [onSelectionChange]
  )

  return useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      const nonSelectionChanges: NodeChange<WorkflowNode>[] = []
      // Built only when a select change arrives, so drag frames (position
      // changes only) do not scan the nodes.
      let currentSelectedNodeIds: ReadonlySet<string> | null = null
      let nextSelectedNodeIdsSet: Set<string> | null = null

      changes.forEach((change) => {
        if (change.type !== "select") {
          nonSelectionChanges.push(change)
          return
        }

        if (!currentSelectedNodeIds || !nextSelectedNodeIdsSet) {
          currentSelectedNodeIds = readSelectedNodeIds(nodesRef.current)
          nextSelectedNodeIdsSet = new Set(currentSelectedNodeIds)
        }

        if (change.selected) {
          nextSelectedNodeIdsSet.add(change.id)
          return
        }
        nextSelectedNodeIdsSet.delete(change.id)
      })

      if (nextSelectedNodeIdsSet && currentSelectedNodeIds) {
        emitSelection([...nextSelectedNodeIdsSet], currentSelectedNodeIds)
      }

      if (nonSelectionChanges.length > 0) {
        onStructuralChanges(nonSelectionChanges)
      }
    },
    [emitSelection, onStructuralChanges]
  )
}

function readSelectedNodeIds(nodes: readonly WorkflowNode[]): Set<string> {
  return new Set(
    nodes.filter((node) => Boolean(node.selected)).map((node) => node.id)
  )
}
