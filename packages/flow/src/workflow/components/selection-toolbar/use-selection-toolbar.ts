import { useCallback, useMemo, useState } from "react"

import type { WorkflowNode } from "../../types"

/**
 * A single selected node already has its commands in the node context menu,
 * so the toolbar only appears for a selection of several nodes.
 */
export const MIN_NODES_FOR_SELECTION_TOOLBAR = 2

export interface SelectionToolbarState {
  /** Ids of the selected nodes, in canvas order. */
  selectedNodeIds: string[]
  isVisible: boolean
  /** Wire to React Flow's node and selection drag start events. */
  onDragStart: () => void
  /** Wire to React Flow's node and selection drag stop events. */
  onDragStop: () => void
}

/**
 * Derives what the selection toolbar shows from the canvas nodes. Dragging is
 * transient UI state with no history or persistence meaning, so it lives here
 * rather than in the workflow store.
 */
export function useSelectionToolbar(
  nodes: readonly WorkflowNode[],
  isObserving: boolean
): SelectionToolbarState {
  const [isDragging, setIsDragging] = useState(false)
  const [wasObserving, setWasObserving] = useState(isObserving)
  // Switching to observe mid-drag tears down React Flow's drag handler, so
  // no drag-stop arrives. Dropping the flag on every mode switch keeps the
  // toolbar from staying hidden afterwards. (State adjusted during render,
  // not in an effect, so there is no extra commit.)
  if (wasObserving !== isObserving) {
    setWasObserving(isObserving)
    setIsDragging(false)
  }
  const selectedNodeIds = useMemo(
    () => nodes.filter((node) => node.selected).map((node) => node.id),
    [nodes]
  )
  const onDragStart = useCallback(() => setIsDragging(true), [])
  const onDragStop = useCallback(() => setIsDragging(false), [])

  return {
    selectedNodeIds,
    isVisible:
      selectedNodeIds.length >= MIN_NODES_FOR_SELECTION_TOOLBAR &&
      !isObserving &&
      !isDragging,
    onDragStart,
    onDragStop,
  }
}
