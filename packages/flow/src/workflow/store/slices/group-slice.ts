import {
  applyDeleteGroupsCommand,
  applyFitGroupCommand,
  applyGroupNodesCommand,
  applyRecolorGroupCommand,
  applyRenameGroupCommand,
  applyResizeGroupCommand,
  applySetGroupCollapsedCommand,
  applyUngroupCommand,
  type GraphEngineResult,
} from "../../graph-engine"
import { normalizeSelectionIds } from "../helpers"
import {
  commitGraphState,
  projectSelectionWithoutHistory,
} from "../history-helpers"
import type {
  WorkflowSliceCreator,
  WorkflowStoreGetState,
  WorkflowStoreSetState,
} from "../types"

/**
 * Commits a command's graph as one undo step. Returns whether the graph
 * changed; a failure lands in `lastError`, an unchanged graph records nothing.
 */
function commitResult(
  get: WorkflowStoreGetState,
  set: WorkflowStoreSetState,
  result: GraphEngineResult
): boolean {
  if (!result.ok) {
    set({ lastError: result.error })
    return false
  }
  if (result.nextGraph === get().graph) {
    return false
  }

  commitGraphState(set, result.nextGraph)
  set({ lastError: null })
  return true
}

export const createGroupSlice: WorkflowSliceCreator = (set, get, api) => ({
  selectedGroupIds: [],
  setSelectedGroups: (groupIds) => {
    const existing = new Set(get().graph.groups.map((group) => group.id))
    const next = normalizeSelectionIds(groupIds).filter((id) =>
      existing.has(id)
    )
    const current = get().selectedGroupIds
    if (
      next.length === current.length &&
      next.every((id, index) => id === current[index])
    ) {
      return
    }
    set({ selectedGroupIds: next })
  },
  groupNodes: (nodeIds) => {
    const result = applyGroupNodesCommand(get().graph, {
      nodeIds: nodeIds ?? get().selectedNodeIds,
    })
    if (!result.ok) {
      set({ lastError: result.error })
      return null
    }

    // The new group takes the selection over from the nodes it was made of.
    commitGraphState(set, result.nextGraph)
    projectSelectionWithoutHistory(api, set, [])
    set({
      selectedNodeIds: [],
      selectedGroupIds: [result.groupId],
      lastError: null,
    })
    return result.groupId
  },
  ungroup: (groupId) => {
    const targetId = groupId ?? soleSelectedGroupId(get)
    if (!targetId) {
      return false
    }

    const changed = commitResult(
      get,
      set,
      applyUngroupCommand(get().graph, { groupId: targetId })
    )
    if (changed) {
      set((state) => ({
        selectedGroupIds: state.selectedGroupIds.filter(
          (id) => id !== targetId
        ),
      }))
    }
    return changed
  },
  deleteGroups: (groupIds) => {
    const targetIds = groupIds ?? get().selectedGroupIds
    if (targetIds.length === 0) {
      return false
    }

    return deleteGroupsAndNodes(get, set, targetIds, [])
  },
  deleteSelection: () => {
    const { selectedGroupIds, selectedNodeIds } = get()
    if (selectedGroupIds.length === 0) {
      return get().deleteNodes(selectedNodeIds)
    }

    return deleteGroupsAndNodes(get, set, selectedGroupIds, selectedNodeIds)
  },
  renameGroup: (groupId, label) => {
    const result = applyRenameGroupCommand(get().graph, { groupId, label })
    commitResult(get, set, result)
    return result.ok
  },
  recolorGroup: (groupId, color) => {
    commitResult(
      get,
      set,
      applyRecolorGroupCommand(get().graph, { groupId, color })
    )
  },
  resizeGroup: (groupId, rect) => {
    commitResult(
      get,
      set,
      applyResizeGroupCommand(get().graph, { groupId, rect })
    )
  },
  fitGroupToContents: (groupId) => {
    commitResult(get, set, applyFitGroupCommand(get().graph, { groupId }))
  },
  setGroupCollapsed: (groupId, collapsed) => {
    const changed = commitResult(
      get,
      set,
      applySetGroupCollapsedCommand(get().graph, { groupId, collapsed })
    )
    if (!changed || !collapsed) {
      return
    }

    // Collapsing deselects the members it hides; the command already cleared
    // their `selected` flags in the same commit.
    set((state) => {
      const stillSelected = new Set(
        state.graph.nodes.filter((node) => node.selected).map((n) => n.id)
      )
      return {
        selectedNodeIds: state.selectedNodeIds.filter((id) =>
          stillSelected.has(id)
        ),
      }
    })
  },
})

function soleSelectedGroupId(get: WorkflowStoreGetState): string | null {
  const { selectedGroupIds } = get()
  return selectedGroupIds.length === 1 ? (selectedGroupIds[0] ?? null) : null
}

/**
 * Removes groups with their members, plus any other listed nodes, and every
 * edge touching a removed node — one commit, so one undo restores it all.
 */
function deleteGroupsAndNodes(
  get: WorkflowStoreGetState,
  set: WorkflowStoreSetState,
  groupIds: string[],
  nodeIds: string[]
): boolean {
  const currentGraph = get().graph
  const groupResult = applyDeleteGroupsCommand(currentGraph, { groupIds })
  const extraNodeIds = new Set(
    nodeIds.filter((id) => !groupResult.removedNodeIds.has(id))
  )
  const removedNodeIds = new Set([
    ...groupResult.removedNodeIds,
    ...extraNodeIds,
  ])
  const afterGroups = groupResult.nextGraph
  // React Flow's own Delete is off while a group is selected, so a selected
  // edge goes in this same step.
  const nextGraph = {
    ...afterGroups,
    nodes:
      extraNodeIds.size === 0
        ? afterGroups.nodes
        : afterGroups.nodes.filter((node) => !extraNodeIds.has(node.id)),
    edges: afterGroups.edges.filter(
      (edge) =>
        !edge.selected &&
        !extraNodeIds.has(edge.source) &&
        !extraNodeIds.has(edge.target)
    ),
  }
  if (
    nextGraph.groups.length === currentGraph.groups.length &&
    removedNodeIds.size === 0
  ) {
    return false
  }

  commitGraphState(set, nextGraph)
  set((state) => ({
    selectedNodeIds: state.selectedNodeIds.filter(
      (id) => !removedNodeIds.has(id)
    ),
    selectedGroupIds: state.selectedGroupIds.filter(
      (id) => !groupIds.includes(id)
    ),
    lastError: null,
  }))
  get().hideValidationForNodes([...removedNodeIds])
  get().hideGlobalValidation()
  return true
}
