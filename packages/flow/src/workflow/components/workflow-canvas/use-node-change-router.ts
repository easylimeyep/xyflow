import { useCallback, useEffect, useRef } from "react"
import type { NodeChange } from "@xyflow/react"

import { parseGroupFrameId } from "../../groups/group-canvas-ids"
import type { Rect } from "../../groups/group-geometry"
import type { WorkflowGroup, WorkflowNode } from "../../types"

interface UseNodeChangeRouterOptions {
  nodes: WorkflowNode[]
  /** Needed to resolve a frame resize into a full rectangle. */
  groups?: readonly WorkflowGroup[]
  onStructuralChanges: (changes: NodeChange<WorkflowNode>[]) => void
  onSelectionChange: (nodeIds: string[]) => void
  /** A frame is being resized; `rect` is where the user is dragging it. */
  onGroupResize?: (groupId: string, rect: Rect) => void
  /** A frame resize ended at `rect`; commit it. */
  onGroupResizeEnd?: (groupId: string, rect: Rect) => void
}

const NO_GROUPS: readonly WorkflowGroup[] = []

/**
 * Separates ReactFlow's unified NodeChange stream into its channels:
 * structural changes (position, add, remove, dimensions), selection changes,
 * and the resize of group frames.
 *
 * ReactFlow emits selection as NodeChange events, but our store manages
 * selection state independently. This hook routes each change type to
 * the appropriate handler without leaking ReactFlow's change model
 * into the store layer.
 *
 * Group frames are derived canvas nodes (`group-frame:<id>`). Their drag
 * positions travel with the structural changes — the store moves the group and
 * its members in the same drag step as any node. Their resize is routed here:
 * React Flow's resizer reports a resize from the left or top edge as a
 * `position` change without `dragging` next to a `dimensions` change, which
 * must never be mistaken for moving the group. Frames are not selectable in
 * React Flow, so they never send select or remove changes worth keeping.
 */
export function useNodeChangeRouter({
  nodes,
  groups = NO_GROUPS,
  onStructuralChanges,
  onSelectionChange,
  onGroupResize,
  onGroupResizeEnd,
}: UseNodeChangeRouterOptions) {
  const nodesRef = useRef(nodes)
  const groupsRef = useRef(groups)
  /** The rectangle of each frame being resized, as last reported. */
  const resizeRectsRef = useRef(new Map<string, Rect>())

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])
  useEffect(() => {
    groupsRef.current = groups
  }, [groups])

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

  const routeFrameResize = useCallback(
    (changes: NodeChange<WorkflowNode>[]): Set<string> => {
      const resizedFrameIds = new Set<string>()
      for (const change of changes) {
        if (change.type !== "dimensions") continue
        const groupId = parseGroupFrameId(change.id)
        if (groupId === null || change.resizing === undefined) continue
        resizedFrameIds.add(change.id)

        const group = groupsRef.current.find((g) => g.id === groupId)
        const previous = resizeRectsRef.current.get(groupId) ?? group
        if (!previous) continue
        const position = changes.find(
          (candidate) =>
            candidate.type === "position" && candidate.id === change.id
        )
        const rect: Rect = {
          x:
            position?.type === "position" && position.position
              ? position.position.x
              : previous.x,
          y:
            position?.type === "position" && position.position
              ? position.position.y
              : previous.y,
          width: change.dimensions?.width ?? previous.width,
          height: change.dimensions?.height ?? previous.height,
        }

        if (change.resizing) {
          resizeRectsRef.current.set(groupId, rect)
          onGroupResize?.(groupId, rect)
        } else {
          resizeRectsRef.current.delete(groupId)
          onGroupResizeEnd?.(groupId, rect)
        }
      }
      return resizedFrameIds
    },
    [onGroupResize, onGroupResizeEnd]
  )

  return useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      const resizedFrameIds = routeFrameResize(changes)
      const nonSelectionChanges: NodeChange<WorkflowNode>[] = []
      // Built only when a select change arrives, so drag frames (position
      // changes only) do not scan the nodes.
      let currentSelectedNodeIds: ReadonlySet<string> | null = null
      let nextSelectedNodeIdsSet: Set<string> | null = null

      changes.forEach((change) => {
        if ("id" in change && parseGroupFrameId(change.id) !== null) {
          // Only a frame drag reaches the store; its resize was routed above.
          if (change.type === "position" && !resizedFrameIds.has(change.id)) {
            nonSelectionChanges.push(change)
          }
          return
        }

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
    [emitSelection, onStructuralChanges, routeFrameResize]
  )
}

function readSelectedNodeIds(nodes: readonly WorkflowNode[]): Set<string> {
  return new Set(
    nodes.filter((node) => Boolean(node.selected)).map((node) => node.id)
  )
}
