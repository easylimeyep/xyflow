"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import { useEventCallback } from "@workspace/ui/hooks/use-event-callback"
import {
  Background,
  Controls,
  ControlButton,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type EdgeProps,
  type NodeChange,
  type Viewport,
  type XYPosition,
} from "@xyflow/react"
import { LayoutTemplate } from "lucide-react"

import { WORKFLOW_NODE_KIND_MIME } from "../../dnd"
import { buildNodeTypes } from "../../node-registry/node-types-builder"
import {
  allDefinitions,
  isNodeKind,
  type NodeKind,
} from "../../node-registry/registry"
import { workflowCanvasStyles } from "../../../styles/components/canvas"
import type { WorkflowEdge, WorkflowNode } from "../../types"

const workflowNodeTypes = buildNodeTypes(allDefinitions)
import { validateConnection } from "../../validation"
import { WorkflowEdgeComponent } from "../workflow-edge"
import { useNodeChangeRouter } from "./use-node-change-router"
import { WORKFLOW_ELK_PADDING } from "../../layout"

const WORKFLOW_MIN_ZOOM = 0.1
const WORKFLOW_MAX_ZOOM = 4

interface WorkflowCanvasProps {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
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
}

function WorkflowCanvasInner({
  nodes,
  edges,
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
}: WorkflowCanvasProps) {
  const reactFlow = useReactFlow<WorkflowNode, WorkflowEdge>()
  const [layoutPending, setLayoutPending] = useState(false)
  const onReactFlowNodesChange = useNodeChangeRouter({
    nodes,
    onStructuralChanges: onNodesChange,
    onSelectionChange: onSelectNodes,
  })

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const rawKind = event.dataTransfer.getData(WORKFLOW_NODE_KIND_MIME)
      if (!isNodeKind(rawKind)) {
        return
      }

      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      onAddNodeAt(rawKind, position)
    },
    [onAddNodeAt, reactFlow]
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
  const edgesWithType = useMemo(
    () =>
      edges.map((edge) => (edge.type ? edge : { ...edge, type: "workflow" })),
    [edges]
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

  return (
    <ReactFlow
      nodes={nodes}
      edges={edgesWithType}
      nodeTypes={workflowNodeTypes}
      edgeTypes={edgeTypes}
      proOptions={{ hideAttribution: true }}
      defaultViewport={viewport}
      minZoom={WORKFLOW_MIN_ZOOM}
      maxZoom={WORKFLOW_MAX_ZOOM}
      onMoveEnd={(_, nextViewport) => onViewportChange(nextViewport)}
      onNodesChange={onReactFlowNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      selectionOnDrag
      panOnDrag={false}
      panOnScroll
      zoomOnPinch
      zoomOnScroll={false}
      isValidConnection={(connection) =>
        validateConnection(connection, nodes, edges).valid
      }
      onPaneClick={onPaneClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseMove={onMouseMove}
      connectionLineStyle={{ strokeWidth: 2, stroke: "var(--border)" }}
    >
      <MiniMap />
      <Controls>
        <ControlButton
          onClick={() => {
            void handleAutoLayout()
          }}
          aria-label="Auto layout workflow"
          title="Auto layout workflow"
          disabled={layoutPending}
        >
          <LayoutTemplate size={16} />
        </ControlButton>
      </Controls>
      <Background />
    </ReactFlow>
  )
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  const styles = workflowCanvasStyles()

  return (
    <div className={styles.root()}>
      <ReactFlowProvider>
        <WorkflowCanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  )
}
