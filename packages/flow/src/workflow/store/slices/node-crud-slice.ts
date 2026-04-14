import {
  applyAddNodeCommand,
  applyUpdateNodeConfigCommand,
  applyUpdateNodeLabelCommand,
} from "../../graph-engine"
import { commitGraphState } from "../history-helpers"
import type { WorkflowSliceCreator } from "../types"

export const createNodeCrudSlice: WorkflowSliceCreator = (set, get) => ({
  addNode: (kind, position) => {
    const currentGraph = get().history.present
    const result = applyAddNodeCommand(currentGraph, { kind, position })
    if (!result.ok) {
      set({ lastError: result.error })
      return
    }
    commitGraphState(set, result.nextGraph)
    set({ lastError: null })
  },
  updateNodeLabel: (nodeId, nextLabel) => {
    const currentGraph = get().history.present
    const result = applyUpdateNodeLabelCommand(currentGraph, { nodeId, nextLabel })
    if (!result.ok) {
      set({ lastError: result.error })
      return
    }
    if (result.nextGraph === currentGraph) {
      return
    }
    commitGraphState(set, result.nextGraph)
    set({ lastError: null })
  },
  updateNodeConfig: (nodeId, update) => {
    const currentGraph = get().history.present
    const result = applyUpdateNodeConfigCommand(currentGraph, { nodeId, update })
    if (!result.ok) {
      set({ lastError: result.error })
      return
    }
    if (result.nextGraph === currentGraph) {
      return
    }
    commitGraphState(set, result.nextGraph)
    set({ lastError: null })
  },
})
