import { useCallback } from "react"

import { useWorkflowStoreApi } from "../../store"

/** Makes `groupId` the whole selection: no nodes, no other groups. */
export function useSelectGroupOnly(): (groupId: string) => void {
  const storeApi = useWorkflowStoreApi()
  return useCallback(
    (groupId: string) => {
      const state = storeApi.getState()
      state.setSelectedNodes([])
      state.setSelectedGroups([groupId])
    },
    [storeApi]
  )
}
