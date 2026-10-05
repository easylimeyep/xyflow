import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { useStoreApi, type Node, type Transform } from "@xyflow/react"

import { parseGroupFrameId } from "../../groups/group-canvas-ids"
import { createCanvasEdgeBuilder } from "../../groups/group-canvas-edges"
import {
  createGroupCanvasNodeBuilder,
  getHiddenMemberIds,
  hideCollapsedMembers,
  isGroupEffectivelyCollapsed,
  type GroupCanvasNode,
} from "../../groups/group-canvas-nodes"
import {
  clampResize,
  getCollapsedCardRect,
  getGroupMembers,
  type Rect,
} from "../../groups/group-geometry"
import type {
  WorkflowCanvasMode,
  WorkflowEdge,
  WorkflowGroup,
  WorkflowNode,
} from "../../types"
import type { GroupCanvasContextValue } from "../workflow-groups"

interface UseGroupCanvasOptions {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  groups: readonly WorkflowGroup[]
  selectedGroupIds: readonly string[]
  mode: WorkflowCanvasMode
  onSelectGroups: (groupIds: string[]) => void
  onSelectNodes: (nodeIds: string[]) => void
  onResizeGroup: (groupId: string, rect: Rect) => void
  onSetGroupCollapsed: (groupId: string, collapsed: boolean) => void
}

export interface GroupCanvasState {
  /** Group frames and cards first, then the workflow nodes with hidden members. */
  canvasNodes: Array<WorkflowNode | GroupCanvasNode>
  /** Edges with proxies for collapsed groups. */
  canvasEdges: WorkflowEdge[]
  /** The workflow nodes the canvas shows, hidden members flagged. */
  visibleNodes: WorkflowNode[]
  groupContext: GroupCanvasContextValue
  onGroupResize: (groupId: string, rect: Rect) => void
  onGroupResizeEnd: (groupId: string, rect: Rect) => void
  onNodeClick: (event: ReactMouseEvent, node: Node) => void
  /** Wire to React Flow's node drag start, beside the toolbar's own. */
  onNodeDragStart: (event: ReactMouseEvent, node: Node) => void
  onSelectionStart: () => void
  onSelectionEnd: () => void
  /**
   * Expands the collapsed group holding `nodeId`, if any — in edit mode
   * through the graph, in observe mode as a view override. Returns whether
   * the node was hidden.
   */
  expandGroupOf: (nodeId: string) => boolean
}

const EMPTY_OVERRIDE: ReadonlyMap<string, boolean> = new Map()

function hasSelectionModifier(event: ReactMouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey
}

function isRectInside(inner: Rect, outer: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  )
}

/** A box selection rectangle (pane pixels) in flow coordinates. */
function toFlowRect(rect: Rect, [tx, ty, zoom]: Transform): Rect {
  return {
    x: (rect.x - tx) / zoom,
    y: (rect.y - ty) / zoom,
    width: rect.width / zoom,
    height: rect.height / zoom,
  }
}

/**
 * Everything the canvas needs to draw and drive groups: the frame and card
 * projection, collapsed members and proxy edges, the observe-mode collapse
 * override, a live resize preview, and group selection.
 *
 * React Flow never selects a group node itself. A header or card click selects
 * the group; a box selection selects a group only when it encloses the whole
 * frame (React Flow would take any frame the box touches); a plain click on a
 * node or a new box clears the selected groups.
 */
export function useGroupCanvasProjection({
  nodes,
  edges,
  groups,
  selectedGroupIds,
  mode,
  onSelectGroups,
  onSelectNodes,
  onResizeGroup,
  onSetGroupCollapsed,
}: UseGroupCanvasOptions): GroupCanvasState {
  const isObserving = mode === "observe"
  const storeApi = useStoreApi()
  const [collapsedOverride, setCollapsedOverride] =
    useState<ReadonlyMap<string, boolean>>(EMPTY_OVERRIDE)
  const [overrideMode, setOverrideMode] = useState(mode)
  // The override belongs to one observing session; any mode switch drops it.
  // (Adjusted during render, so there is no extra commit.)
  if (overrideMode !== mode) {
    setOverrideMode(mode)
    setCollapsedOverride(EMPTY_OVERRIDE)
  }
  const activeOverride = isObserving ? collapsedOverride : EMPTY_OVERRIDE

  const [resizePreview, setResizePreview] = useState<
    ReadonlyMap<string, WorkflowGroup>
  >(() => new Map())
  const effectiveGroups = useMemo(
    () =>
      resizePreview.size === 0
        ? groups
        : groups.map((group) => resizePreview.get(group.id) ?? group),
    [groups, resizePreview]
  )

  // One builder per canvas: it remembers the node it made per group.
  const [buildGroupCanvasNodes] = useState(createGroupCanvasNodeBuilder)
  const selectedGroupIdSet = useMemo(
    () => new Set(selectedGroupIds),
    [selectedGroupIds]
  )
  const groupNodes = useMemo(
    () =>
      buildGroupCanvasNodes(effectiveGroups, nodes, {
        collapsedOverride: activeOverride,
        selectedGroupIds: selectedGroupIdSet,
        editable: !isObserving,
      }),
    [
      activeOverride,
      buildGroupCanvasNodes,
      effectiveGroups,
      isObserving,
      nodes,
      selectedGroupIdSet,
    ]
  )
  const visibleNodes = useMemo(
    () =>
      hideCollapsedMembers(
        nodes,
        getHiddenMemberIds(effectiveGroups, nodes, activeOverride)
      ),
    [activeOverride, effectiveGroups, nodes]
  )
  const canvasNodes = useMemo<Array<WorkflowNode | GroupCanvasNode>>(
    () =>
      groupNodes.length === 0 ? visibleNodes : [...groupNodes, ...visibleNodes],
    [groupNodes, visibleNodes]
  )
  // Keyed on the edges and on who is hidden in which collapsed group, not on
  // node positions: a drag must not hand React Flow a new object per edge.
  const [buildCanvasEdges] = useState(createCanvasEdgeBuilder)
  const canvasEdges = useMemo(
    () =>
      buildCanvasEdges(
        edges,
        groupNodes
          .filter((groupNode) => groupNode.data.collapsed)
          .map((groupNode) => ({
            groupId: groupNode.data.groupId,
            memberIds: groupNode.data.memberIds,
          }))
      ),
    [buildCanvasEdges, edges, groupNodes]
  )

  const setCollapsed = useCallback(
    (groupId: string, collapsed: boolean) => {
      if (!isObserving) {
        onSetGroupCollapsed(groupId, collapsed)
        return
      }
      setCollapsedOverride((current) =>
        new Map(current).set(groupId, collapsed)
      )
    },
    [isObserving, onSetGroupCollapsed]
  )
  const groupContext = useMemo(() => ({ setCollapsed }), [setCollapsed])

  const latestRef = useRef({ groups, nodes, selectedGroupIds, activeOverride })
  useEffect(() => {
    latestRef.current = { groups, nodes, selectedGroupIds, activeOverride }
  }, [activeOverride, groups, nodes, selectedGroupIds])

  const clampedResize = useCallback((groupId: string, rect: Rect) => {
    const { groups: currentGroups, nodes: currentNodes } = latestRef.current
    const group = currentGroups.find((candidate) => candidate.id === groupId)
    return group
      ? clampResize(group, getGroupMembers(groupId, currentNodes), rect)
      : null
  }, [])
  const onGroupResize = useCallback(
    (groupId: string, rect: Rect) => {
      const preview = clampedResize(groupId, rect)
      if (!preview) return
      setResizePreview((current) => new Map(current).set(groupId, preview))
    },
    [clampedResize]
  )
  const onGroupResizeEnd = useCallback(
    (groupId: string, rect: Rect) => {
      setResizePreview((current) => {
        if (!current.has(groupId)) return current
        const next = new Map(current)
        next.delete(groupId)
        return next
      })
      onResizeGroup(groupId, rect)
    },
    [onResizeGroup]
  )

  const onNodeClick = useCallback(
    (event: ReactMouseEvent, node: Node) => {
      const groupId = parseGroupFrameId(node.id)
      const { selectedGroupIds: current } = latestRef.current
      if (groupId !== null) {
        if (hasSelectionModifier(event)) {
          onSelectGroups(
            current.includes(groupId)
              ? current.filter((id) => id !== groupId)
              : [...current, groupId]
          )
          return
        }
        onSelectNodes([])
        onSelectGroups([groupId])
        return
      }
      if (!hasSelectionModifier(event) && current.length > 0) {
        onSelectGroups([])
      }
    },
    [onSelectGroups, onSelectNodes]
  )

  // Pressing an unselected node and dragging it replaces the selection, as a
  // plain click does; React Flow fires no click for it, so the groups are
  // cleared here.
  const onNodeDragStart = useCallback(
    (event: ReactMouseEvent, node: Node) => {
      if (
        parseGroupFrameId(node.id) !== null ||
        hasSelectionModifier(event) ||
        latestRef.current.selectedGroupIds.length === 0
      ) {
        return
      }
      const wasSelected = latestRef.current.nodes.some(
        (candidate) => candidate.id === node.id && candidate.selected
      )
      if (!wasSelected) {
        onSelectGroups([])
      }
    },
    [onSelectGroups]
  )

  // The box is read on release, when React Flow has already cleared it, so
  // its last shape is remembered as it changes — without re-rendering.
  const lastSelectionRef = useRef<{ rect: Rect; transform: Transform } | null>(
    null
  )
  useEffect(
    () =>
      storeApi.subscribe((state) => {
        if (state.userSelectionRect) {
          lastSelectionRef.current = {
            rect: state.userSelectionRect,
            transform: state.transform,
          }
        }
      }),
    [storeApi]
  )
  // React Flow keeps its multi-selection overlay up after a box selection.
  // Once no workflow node is selected (say the box was just grouped), the
  // overlay would only cover the selected group's header and swallow its
  // clicks, so it is put away.
  const hasSelectedNode = nodes.some((node) => node.selected)
  useEffect(() => {
    if (!hasSelectedNode && storeApi.getState().nodesSelectionActive) {
      storeApi.setState({ nodesSelectionActive: false })
    }
  }, [hasSelectedNode, selectedGroupIds, storeApi])

  const onSelectionStart = useCallback(() => {
    lastSelectionRef.current = null
    if (latestRef.current.selectedGroupIds.length > 0) {
      onSelectGroups([])
    }
  }, [onSelectGroups])
  const onSelectionEnd = useCallback(() => {
    const selection = lastSelectionRef.current
    lastSelectionRef.current = null
    if (!selection) return
    const box = toFlowRect(selection.rect, selection.transform)
    const { groups: currentGroups, activeOverride: override } =
      latestRef.current
    const enclosed = currentGroups
      .filter((group) =>
        isRectInside(
          isGroupEffectivelyCollapsed(group, override)
            ? getCollapsedCardRect(group)
            : group,
          box
        )
      )
      .map((group) => group.id)
    if (enclosed.length > 0) {
      onSelectGroups(enclosed)
    }
  }, [onSelectGroups])

  const expandGroupOf = useCallback(
    (nodeId: string) => {
      const {
        groups: currentGroups,
        nodes: currentNodes,
        activeOverride: override,
      } = latestRef.current
      const groupId = currentNodes.find((node) => node.id === nodeId)?.data
        .groupId
      const group = currentGroups.find((candidate) => candidate.id === groupId)
      if (!group || !isGroupEffectivelyCollapsed(group, override)) {
        return false
      }
      setCollapsed(group.id, false)
      return true
    },
    [setCollapsed]
  )

  return {
    canvasNodes,
    canvasEdges,
    visibleNodes,
    groupContext,
    onGroupResize,
    onGroupResizeEnd,
    onNodeClick,
    onNodeDragStart,
    onSelectionStart,
    onSelectionEnd,
    expandGroupOf,
  }
}
