"use client"

import { createContext, useContext } from "react"

export interface GroupCanvasContextValue {
  /**
   * Collapses or expands a group the way the canvas mode allows: in edit mode
   * through the undoable graph command, in observe mode as a local view
   * override that never reaches the workflow.
   */
  setCollapsed: (groupId: string, collapsed: boolean) => void
}

const noop = () => {}

const GroupCanvasContext = createContext<GroupCanvasContextValue>({
  setCollapsed: noop,
})

export const GroupCanvasProvider = GroupCanvasContext.Provider

export function useGroupCanvas(): GroupCanvasContextValue {
  return useContext(GroupCanvasContext)
}
