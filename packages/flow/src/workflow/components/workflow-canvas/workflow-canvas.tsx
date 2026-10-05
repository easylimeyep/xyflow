"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { useEventCallback } from "@flow/ui/hooks/use-event-callback"
import {
  Background,
  NodeToolbar,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
  useNodesInitialized,
  useStore,
  type Connection,
  type EdgeChange,
  type EdgeProps,
  type NodeChange,
  type Viewport,
  type XYPosition,
} from "@xyflow/react"
import { LayoutTemplate, Maximize2, ZoomIn, ZoomOut } from "lucide-react"

import { WORKFLOW_NODE_KIND_MIME } from "../../dnd"
import {
  GROUP_CARD_NODE_TYPE,
  GROUP_FRAME_NODE_TYPE,
} from "../../groups/group-canvas-nodes"
import { parseGroupFrameId } from "../../groups/group-canvas-ids"
import {
  GROUP_FRAME_HEADER_HEIGHT,
  type Rect,
} from "../../groups/group-geometry"
import { getEstimatedNodeHeight } from "../../layout/node-size-estimate"
import { DEFAULT_NODE_WIDTH } from "../../node-registry/node-factory"
import { buildNodeTypes } from "../../node-registry/node-types-builder"
import type { NodeKind } from "../../node-registry/registry"
import {
  useNodeDefinitions,
  useNodeRegistry,
} from "../../node-registry/use-node-definitions"
import { workflowCanvasStyles } from "../../../styles/components/canvas"
import type {
  WorkflowCanvasMode,
  WorkflowEdge,
  WorkflowGroup,
  WorkflowNode,
} from "../../types"

import { validateConnection } from "../../validation"
import { WorkflowEdgeComponent } from "../workflow-edge"
import { WorkflowMiniMap } from "../workflow-minimap"
import { SelectionToolbar, useSelectionToolbar } from "../selection-toolbar"
import { isInteractiveEventTarget } from "../hotkeys"
import { GroupCanvasProvider, GroupCard, GroupFrame } from "../workflow-groups"
import { useGroupCanvasProjection } from "./use-group-canvas-projection"
import { useNodeChangeRouter } from "./use-node-change-router"
import { WORKFLOW_ELK_PADDING } from "../../layout"
import { LARGE_GRAPH_MIN_NODES } from "../../large-graph"
import type { WorkflowEditorAnchorRefs } from "../../tour"
import { useWorkflowEditorAnchorRef } from "../../tour/anchors"

const WORKFLOW_MIN_ZOOM = 0.1
const WORKFLOW_MAX_ZOOM = 4
const WORKFLOW_MINIMAP_NAVIGATION_DURATION_MS = 200
/**
 * The lowest zoom at which a revealed node is comfortably readable. Revealing
 * raises the zoom to this level when the user is further out, and never lowers
 * a zoom the user chose above it.
 */
export const MIN_READABLE_ZOOM = 0.8

/** Centers the viewport on a node without selecting it. */
export type RevealNode = (nodeId: string) => void

const NO_GROUPS: readonly WorkflowGroup[] = []
/** Where React Flow puts the toolbar of a selected node: 1000 + 1. */
const GROUP_TOOLBAR_STYLE = { zIndex: 1001 } as const
const NO_GROUP_IDS: readonly string[] = []
const noop = () => {}

interface WorkflowCanvasProps {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  /** Node groups, drawn as frames (expanded) or cards (collapsed). */
  groups?: readonly WorkflowGroup[]
  selectedGroupIds?: readonly string[]
  onSelectGroups?: (groupIds: string[]) => void
  /** Commits a group resize the user finished. */
  onResizeGroup?: (groupId: string, rect: Rect) => void
  /** Collapses or expands a group in the workflow (edit mode). */
  onSetGroupCollapsed?: (groupId: string, collapsed: boolean) => void
  viewport: { x: number; y: number; zoom: number }
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void
  onConnect: (connection: Connection) => void
  onViewportChange: (viewport: Viewport) => void
  onSelectNodes: (nodeIds: string[]) => void
  onPaneClick: () => void
  onAddNodeAt: (kind: NodeKind, position: XYPosition) => void
  onStartInsertFromEdge: (edgeId: string) => void
  onDeleteEdge: (edgeId: string) => void
  onPointerFlowPosition: (position: XYPosition) => void
  edgeInsertPendingId: string | null
  onAutoLayout?: () => Promise<boolean>
  autoLayoutOnInit?: "after-measure"
  onMeasuredInitialAutoLayout?: () => Promise<boolean>
  anchorRefs?: WorkflowEditorAnchorRefs
  /**
   * `observe` makes the canvas read-only: node dragging, connecting, edge
   * selection, and delete are disabled while pan, zoom, and node selection
   * stay on. Defaults to `edit`, so existing behaviour is unchanged.
   */
  mode?: WorkflowCanvasMode
  /**
   * When `true`, the canvas observes its own box and refits the viewport
   * whenever that box changes size. Defaults to `false` — a host whose
   * layout can resize the canvas (resizable panes, collapsible sidebars,
   * etc.) opts in explicitly; nothing observes anything otherwise.
   */
  refitOnResize?: boolean
  /**
   * Receives the canvas's `revealNode` once it is mounted, and `null` when it
   * unmounts. This is how parts rendered outside the React Flow provider (the
   * search bar) move the viewport.
   */
  onRevealNodeChange?: (revealNode: RevealNode | null) => void
}

function WorkflowCanvasInner({
  nodes,
  edges,
  groups = NO_GROUPS,
  selectedGroupIds = NO_GROUP_IDS,
  onSelectGroups = noop,
  onResizeGroup = noop,
  onSetGroupCollapsed = noop,
  viewport,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onViewportChange,
  onSelectNodes,
  onPaneClick,
  onAddNodeAt,
  onStartInsertFromEdge,
  onDeleteEdge,
  onPointerFlowPosition,
  edgeInsertPendingId,
  onAutoLayout,
  autoLayoutOnInit,
  onMeasuredInitialAutoLayout,
  anchorRefs,
  mode = "edit",
  refitOnResize = false,
  onRevealNodeChange,
}: WorkflowCanvasProps) {
  const isObserving = mode === "observe"
  const canvasRef = useRef<HTMLDivElement>(null)
  const definitions = useNodeDefinitions()
  const registry = useNodeRegistry()
  const reactFlow = useReactFlow<WorkflowNode, WorkflowEdge>()
  // The two zoom buttons only need to know whether a limit has been reached.
  // `useViewport` would hand over the whole transform, which re-renders this
  // component on every pan and zoom frame; these selectors return a boolean,
  // so the canvas re-renders only when a limit is actually crossed.
  const maxZoomReached = useStore(
    (state) => (state.transform[2] ?? 1) >= WORKFLOW_MAX_ZOOM
  )
  const minZoomReached = useStore(
    (state) => (state.transform[2] ?? 1) <= WORKFLOW_MIN_ZOOM
  )
  const nodesInitialized = useNodesInitialized()
  const groupCanvas = useGroupCanvasProjection({
    nodes,
    edges,
    groups,
    selectedGroupIds,
    mode,
    onSelectGroups,
    onSelectNodes,
    onResizeGroup,
    onSetGroupCollapsed,
  })
  const [layoutPending, setLayoutPending] = useState(false)
  const shouldRunMeasuredInitialLayout =
    autoLayoutOnInit === "after-measure" && onMeasuredInitialAutoLayout != null
  const initialLayoutAttemptedRef = useRef(false)
  const [initialLayoutPending, setInitialLayoutPending] = useState(
    shouldRunMeasuredInitialLayout && nodes.length > 0
  )
  // Members hidden inside a collapsed group never mount, so they never report
  // a size; the measured layout waits for the nodes that can.
  const allNodesMeasured =
    nodes.length === 0 ||
    groupCanvas.visibleNodes.every(
      (node) =>
        node.hidden ||
        (node.measured?.width != null && node.measured.height != null)
    )
  // The measured initial layout waits for every node to report its size, and
  // a culled node never mounts to report one.
  const shouldCullToViewport =
    nodes.length > LARGE_GRAPH_MIN_NODES && !initialLayoutPending
  const selectionToolbar = useSelectionToolbar(
    nodes,
    isObserving,
    selectedGroupIds
  )
  const onReactFlowNodesChange = useNodeChangeRouter({
    nodes,
    groups,
    onStructuralChanges: onNodesChange,
    onSelectionChange: onSelectNodes,
    onGroupResize: groupCanvas.onGroupResize,
    onGroupResizeEnd: groupCanvas.onGroupResizeEnd,
  })

  // A host dialog that traps focus (react-aria `FocusScope contain`) hands
  // focus back to the last focused field when the user clicks the canvas,
  // which is not focusable. The editing hotkeys skip editable targets, so
  // copy/duplicate/delete would look dead. Taking focus here keeps them
  // reachable; presses on fields and controls keep their own focus.
  const onCanvasPointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const container = event.currentTarget
      // React events follow the component tree, so presses inside overlays
      // portaled out of a node (menus, selects, popovers) arrive here too.
      // Only presses that land inside the canvas box belong to the canvas.
      const isInsideCanvas =
        event.target instanceof Node && container.contains(event.target)
      if (
        !isInsideCanvas ||
        initialLayoutPending ||
        isInteractiveEventTarget(event.target)
      ) {
        return
      }

      container.focus({ preventScroll: true })
    },
    [initialLayoutPending]
  )
  const focusCanvas = useCallback(() => {
    canvasRef.current?.focus({ preventScroll: true })
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const rawKind = event.dataTransfer.getData(WORKFLOW_NODE_KIND_MIME)
      if (!registry.has(rawKind)) {
        return
      }

      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      onAddNodeAt(rawKind, position)
    },
    [onAddNodeAt, reactFlow, registry]
  )
  const onPointerFlowPositionEvent = useEventCallback(onPointerFlowPosition)
  const pendingPointerRef = useRef<XYPosition | null>(null)
  const pointerFrameRef = useRef<number | null>(null)
  const flushPointerFrame = useCallback(() => {
    pointerFrameRef.current = null
    const nextPointerPosition = pendingPointerRef.current
    if (!nextPointerPosition) {
      return
    }

    pendingPointerRef.current = null
    onPointerFlowPositionEvent(nextPointerPosition)
  }, [onPointerFlowPositionEvent])
  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      pendingPointerRef.current = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      if (pointerFrameRef.current !== null) {
        return
      }

      pointerFrameRef.current = window.requestAnimationFrame(flushPointerFrame)
    },
    [flushPointerFrame, reactFlow]
  )
  useEffect(
    () => () => {
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current)
      }
    },
    []
  )
  const edgeInteractionRef = useRef({
    onStartInsertFromEdge,
    onDeleteEdge,
    edgeInsertPendingId,
  })
  useLayoutEffect(() => {
    edgeInteractionRef.current.onStartInsertFromEdge = onStartInsertFromEdge
    edgeInteractionRef.current.onDeleteEdge = onDeleteEdge
    edgeInteractionRef.current.edgeInsertPendingId = edgeInsertPendingId
  }, [edgeInsertPendingId, onDeleteEdge, onStartInsertFromEdge])
  const workflowNodeTypes = useMemo(
    () => ({
      ...buildNodeTypes(definitions),
      [GROUP_FRAME_NODE_TYPE]: GroupFrame,
      [GROUP_CARD_NODE_TYPE]: GroupCard,
    }),
    [definitions]
  )
  const edgesWithType = useMemo(
    () =>
      groupCanvas.canvasEdges.map((edge) => {
        const typed = edge.type ? edge : { ...edge, type: "workflow" }
        if (!isObserving) {
          return typed
        }

        return { ...typed, selectable: false, deletable: false }
      }),
    [groupCanvas.canvasEdges, isObserving]
  )
  const edgeTypes = useMemo(
    () => ({
      workflow: (props: EdgeProps<WorkflowEdge>) => (
        <WorkflowEdgeComponent
          {...props}
          onStartInsert={(edgeId) =>
            edgeInteractionRef.current.onStartInsertFromEdge(edgeId)
          }
          onDeleteEdge={(edgeId) =>
            edgeInteractionRef.current.onDeleteEdge(edgeId)
          }
          isInsertPending={
            props.id === edgeInteractionRef.current.edgeInsertPendingId
          }
        />
      ),
    }),
    []
  )
  const handleAutoLayout = useCallback(async () => {
    if (!onAutoLayout || layoutPending) {
      return
    }

    setLayoutPending(true)

    try {
      const didLayout = await onAutoLayout()
      if (!didLayout) {
        return
      }

      window.requestAnimationFrame(() => {
        void reactFlow.fitView({
          padding: WORKFLOW_ELK_PADDING,
          minZoom: WORKFLOW_MIN_ZOOM,
          maxZoom: WORKFLOW_MAX_ZOOM,
        })
      })
    } finally {
      setLayoutPending(false)
    }
  }, [layoutPending, onAutoLayout, reactFlow])
  useEffect(() => {
    const element = canvasRef.current
    if (!refitOnResize || !element || typeof ResizeObserver === "undefined") {
      return
    }

    let frame = 0
    // ResizeObserver fires once immediately on observe(). That first
    // delivery reports the box the canvas already mounted with, not a
    // resize — skip it so mounting behaviour stays owned by the existing
    // auto-layout fit paths above.
    let hasSkippedInitialDelivery = false
    const observer = new ResizeObserver(() => {
      if (!hasSkippedInitialDelivery) {
        hasSkippedInitialDelivery = true
        return
      }

      // One frame later: the new box has to reach layout before a fit can be
      // measured against it. This is the same wait the host used to perform
      // by hand before clicking the fit button.
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        void reactFlow.fitView({
          padding: WORKFLOW_ELK_PADDING,
          minZoom: WORKFLOW_MIN_ZOOM,
          maxZoom: WORKFLOW_MAX_ZOOM,
        })
      })
    })

    observer.observe(element)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [refitOnResize, reactFlow])
  useEffect(() => {
    if (!shouldRunMeasuredInitialLayout) {
      setInitialLayoutPending(false)
      return
    }

    if (initialLayoutAttemptedRef.current) {
      return
    }

    if (nodes.length === 0) {
      initialLayoutAttemptedRef.current = true
      setInitialLayoutPending(false)
      return
    }

    if (!nodesInitialized || !allNodesMeasured) {
      setInitialLayoutPending(true)
      return
    }

    let cancelled = false
    initialLayoutAttemptedRef.current = true
    setInitialLayoutPending(true)

    void onMeasuredInitialAutoLayout?.()
      .then((didLayout) => {
        if (cancelled) {
          return
        }

        if (didLayout) {
          window.requestAnimationFrame(() => {
            void reactFlow.fitView({
              padding: WORKFLOW_ELK_PADDING,
              minZoom: WORKFLOW_MIN_ZOOM,
              maxZoom: WORKFLOW_MAX_ZOOM,
            })
          })
        }

        setInitialLayoutPending(false)
      })
      .catch(() => {
        if (!cancelled) {
          setInitialLayoutPending(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    allNodesMeasured,
    nodes.length,
    nodesInitialized,
    onMeasuredInitialAutoLayout,
    reactFlow,
    shouldRunMeasuredInitialLayout,
  ])
  const handleMiniMapClick = useCallback(
    (_event: React.MouseEvent, position: XYPosition) => {
      const currentViewport = reactFlow.getViewport()

      void reactFlow.setCenter(position.x, position.y, {
        zoom: currentViewport.zoom,
        duration: WORKFLOW_MINIMAP_NAVIGATION_DURATION_MS,
      })
    },
    [reactFlow]
  )
  const { expandGroupOf } = groupCanvas
  const revealNode = useCallback<RevealNode>(
    (nodeId) => {
      const node = reactFlow.getInternalNode(nodeId)
      if (!node) {
        return
      }

      const isGroup = parseGroupFrameId(nodeId) !== null
      // A node hidden in a collapsed group is shown first. It may never have
      // rendered, so its size falls back to the box a compact node draws. A
      // group itself is revealed as it stands: collapsed stays collapsed.
      if (!isGroup) {
        expandGroupOf(nodeId)
      }
      const { x, y } = node.internals.positionAbsolute
      const width = node.measured.width ?? node.width ?? DEFAULT_NODE_WIDTH
      const height =
        node.measured.height ??
        node.height ??
        getEstimatedNodeHeight(node.internals.userNode)
      // A frame can be larger than the viewport; its header is what was found.
      const centerY = isGroup
        ? y + Math.min(height, GROUP_FRAME_HEADER_HEIGHT) / 2
        : y + height / 2
      const zoom = Math.min(
        WORKFLOW_MAX_ZOOM,
        Math.max(WORKFLOW_MIN_ZOOM, reactFlow.getZoom(), MIN_READABLE_ZOOM)
      )

      void reactFlow.setCenter(x + width / 2, centerY, {
        zoom,
        duration: WORKFLOW_MINIMAP_NAVIGATION_DURATION_MS,
      })
    },
    [expandGroupOf, reactFlow]
  )
  useEffect(() => {
    if (!onRevealNodeChange) {
      return
    }

    onRevealNodeChange(revealNode)
    return () => onRevealNodeChange(null)
  }, [onRevealNodeChange, revealNode])
  const controlsRef = useWorkflowEditorAnchorRef(anchorRefs, "controls")
  const zoomInRef = useWorkflowEditorAnchorRef(anchorRefs, "zoomIn")
  const zoomOutRef = useWorkflowEditorAnchorRef(anchorRefs, "zoomOut")
  const fitViewRef = useWorkflowEditorAnchorRef(anchorRefs, "fitView")
  const autoLayoutRef = useWorkflowEditorAnchorRef(anchorRefs, "autoLayout")
  const styles = workflowCanvasStyles({ initializing: initialLayoutPending })

  return (
    <>
      <div
        ref={canvasRef}
        className={styles.flow()}
        aria-hidden={initialLayoutPending}
        tabIndex={-1}
        data-workflow-canvas-focus-target=""
        onPointerDownCapture={onCanvasPointerDownCapture}
      >
        <GroupCanvasProvider value={groupCanvas.groupContext}>
          <ReactFlow
            // Group frames and cards are derived canvas nodes beside the
            // workflow nodes; every handler routes them by their id prefix.
            nodes={groupCanvas.canvasNodes as WorkflowNode[]}
            edges={edgesWithType}
            nodeTypes={workflowNodeTypes}
            edgeTypes={edgeTypes}
            proOptions={{ hideAttribution: true }}
            onlyRenderVisibleElements={shouldCullToViewport}
            defaultViewport={viewport}
            minZoom={WORKFLOW_MIN_ZOOM}
            maxZoom={WORKFLOW_MAX_ZOOM}
            nodesDraggable={!isObserving}
            nodesConnectable={!isObserving}
            // With a group selected, Delete goes through the editor's own
            // command so the group, its members, and the selected nodes go in
            // one step; React Flow would remove only the nodes.
            deleteKeyCode={
              isObserving || selectedGroupIds.length > 0
                ? null
                : ["Backspace", "Delete"]
            }
            onMoveEnd={(_, nextViewport) => onViewportChange(nextViewport)}
            onNodesChange={onReactFlowNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={isObserving ? undefined : onConnect}
            selectionMode={SelectionMode.Partial}
            panOnDrag
            panOnScroll
            zoomOnPinch
            zoomOnScroll={false}
            isValidConnection={(connection) =>
              validateConnection(registry, connection, nodes, edges).valid
            }
            onPaneClick={onPaneClick}
            onDragOver={isObserving ? undefined : onDragOver}
            onDrop={isObserving ? undefined : onDrop}
            onMouseMove={onMouseMove}
            onNodeClick={groupCanvas.onNodeClick}
            onSelectionStart={groupCanvas.onSelectionStart}
            onSelectionEnd={groupCanvas.onSelectionEnd}
            onNodeDragStart={(event, node) => {
              groupCanvas.onNodeDragStart(event, node)
              selectionToolbar.onDragStart()
            }}
            onNodeDragStop={selectionToolbar.onDragStop}
            onSelectionDragStart={selectionToolbar.onDragStart}
            onSelectionDragStop={selectionToolbar.onDragStop}
            connectionLineStyle={{ strokeWidth: 2, stroke: "var(--border)" }}
          >
            <NodeToolbar
              nodeId={selectionToolbar.selectedNodeIds}
              isVisible={selectionToolbar.isVisible}
              // React Flow stacks a toolbar just above the nodes it belongs
              // to. A group frame sits beneath everything, which would put
              // its toolbar under the pane, out of reach of the pointer.
              style={
                selectedGroupIds.length > 0 ? GROUP_TOOLBAR_STYLE : undefined
              }
              position={Position.Top}
              align="end"
            >
              <SelectionToolbar onAfterCommand={focusCanvas} />
            </NodeToolbar>
            <WorkflowMiniMap onClick={handleMiniMapClick} />
            <Panel
              ref={controlsRef}
              className="react-flow__controls horizontal"
              position="bottom-left"
              data-testid="rf__controls"
              aria-label="React Flow controls"
            >
              <button
                ref={zoomInRef}
                type="button"
                className="react-flow__controls-button react-flow__controls-zoomin"
                onClick={() => {
                  void reactFlow.zoomIn()
                }}
                aria-label="Zoom in"
                title="Zoom in"
                disabled={maxZoomReached}
              >
                <ZoomIn size={16} />
              </button>
              <button
                ref={zoomOutRef}
                type="button"
                className="react-flow__controls-button react-flow__controls-zoomout"
                onClick={() => {
                  void reactFlow.zoomOut()
                }}
                aria-label="Zoom out"
                title="Zoom out"
                disabled={minZoomReached}
              >
                <ZoomOut size={16} />
              </button>
              <button
                ref={fitViewRef}
                type="button"
                className="react-flow__controls-button react-flow__controls-fitview"
                onClick={() => {
                  void reactFlow.fitView({
                    padding: WORKFLOW_ELK_PADDING,
                    minZoom: WORKFLOW_MIN_ZOOM,
                    maxZoom: WORKFLOW_MAX_ZOOM,
                  })
                }}
                aria-label="Fit view"
                title="Fit view"
              >
                <Maximize2 size={16} />
              </button>
              <button
                ref={autoLayoutRef}
                type="button"
                className="react-flow__controls-button react-flow__controls-auto-layout"
                onClick={() => {
                  void handleAutoLayout()
                }}
                aria-label="Auto layout workflow"
                title="Auto layout workflow"
                disabled={layoutPending || initialLayoutPending}
              >
                <LayoutTemplate size={16} />
              </button>
            </Panel>
            <Background />
          </ReactFlow>
        </GroupCanvasProvider>
      </div>
      {initialLayoutPending ? (
        <div
          className={styles.initializingOverlay()}
          role="status"
          aria-live="polite"
        >
          Preparing measured layout...
        </div>
      ) : null}
    </>
  )
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  const styles = workflowCanvasStyles()

  return (
    <div
      className={styles.root()}
      role="region"
      aria-label="Workflow canvas"
      data-testid="workflow-canvas"
    >
      <ReactFlowProvider>
        <WorkflowCanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  )
}
