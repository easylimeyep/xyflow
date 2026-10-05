import { useCallback, useMemo, useState } from "react"

import { toGroupFrameId } from "../../groups/group-canvas-ids"
import type { WorkflowNode } from "../../types"

/**
 * A single selected node already has its commands in the node context menu,
 * so the toolbar only appears for a selection of several nodes.
 */
export const MIN_NODES_FOR_SELECTION_TOOLBAR = 2

export interface SelectionToolbarState {
  /**
   * Canvas node ids the toolbar is anchored to: the selected nodes, in canvas
   * order, then the frames of the selected groups.
   */
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
  isObserving: boolean,
  selectedGroupIds: readonly string[] = []
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
  const selectedWorkflowNodeIds = useMemo(
    () => nodes.filter((node) => node.selected).map((node) => node.id),
    [nodes]
  )
  const selectedNodeIds = useMemo(
    () =>
      selectedGroupIds.length === 0
        ? selectedWorkflowNodeIds
        : [...selectedWorkflowNodeIds, ...selectedGroupIds.map(toGroupFrameId)],
    [selectedGroupIds, selectedWorkflowNodeIds]
  )
  const onDragStart = useCallback(() => setIsDragging(true), [])
  const onDragStop = useCallback(() => setIsDragging(false), [])

  return {
    selectedNodeIds,
    // A selected group has no other place for its commands, so one group is
    // enough to show the toolbar.
    isVisible:
      (selectedWorkflowNodeIds.length >= MIN_NODES_FOR_SELECTION_TOOLBAR ||
        selectedGroupIds.length > 0) &&
      !isObserving &&
      !isDragging,
    onDragStart,
    onDragStop,
  }
}
