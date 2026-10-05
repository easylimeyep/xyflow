import {
  selectGroupSearchStatus,
  useWorkflowStore,
  type NodeSearchStatus,
} from "../../store"

/**
 * Where a group's label stands in the canvas search. A string, so the frame
 * re-renders only when its own status flips.
 */
export function useGroupSearchStatus(groupId: string): NodeSearchStatus {
  return useWorkflowStore((state) => selectGroupSearchStatus(state, groupId))
}
