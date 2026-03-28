"use client"

import { useCallback, useLayoutEffect, useMemo, useRef } from "react"

import {
  Background,
  Controls,
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

import { WORKFLOW_NODE_KIND_MIME } from "../dnd"
import { workflowNodeTypes } from "../nodes/node-types"
import { WorkflowEdgeComponent } from "./workflow-edge"
import { isNodeKind, type NodeKind, type WorkflowEdge, type WorkflowNode } from "../types"
import { validateConnection } from "../validation"

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
}: WorkflowCanvasProps) {
  const reactFlow = useReactFlow<WorkflowNode, WorkflowEdge>()
  const lastSelectionSignatureRef = useRef<string | null>(null)
  const emitSelection = useCallback(
    (nodeIds: string[]) => {
      const nextSignature = [...nodeIds].sort().join("\u0000")
      if (nextSignature === lastSelectionSignatureRef.current) {
        return
      }

      lastSelectionSignatureRef.current = nextSignature
      onSelectNodes(nodeIds)
    },
    [onSelectNodes]
  )
  const onReactFlowNodesChange = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      const nonSelectionChanges: NodeChange<WorkflowNode>[] = []
      let nextSelectedNodeIdsSet: Set<string> | null = null

      changes.forEach((change) => {
        if (change.type !== "select") {
          nonSelectionChanges.push(change)
          return
        }

        if (!nextSelectedNodeIdsSet) {
          nextSelectedNodeIdsSet = new Set(
            nodes.filter((node) => Boolean(node.selected)).map((node) => node.id)
          )
        }

        if (change.selected) {
          nextSelectedNodeIdsSet.add(change.id)
          return
        }
        nextSelectedNodeIdsSet.delete(change.id)
      })

      if (nextSelectedNodeIdsSet) {
        emitSelection([...nextSelectedNodeIdsSet])
      }

      if (nonSelectionChanges.length > 0) {
        onNodesChange(nonSelectionChanges)
      }
    },
    [emitSelection, nodes, onNodesChange]
  )

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
  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      onPointerFlowPosition(
        reactFlow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })
      )
    },
    [onPointerFlowPosition, reactFlow]
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
    () => edges.map((edge) => (edge.type ? edge : { ...edge, type: "workflow" })),
    [edges]
  )
  const edgeTypes = useMemo(
    () => ({
      workflow: (props: EdgeProps<WorkflowEdge>) => (
        <WorkflowEdgeComponent
          {...props}
          onStartInsert={(edgeId) => edgeInteractionRef.current.onStartInsertFromEdge(edgeId)}
          onDeleteEdge={(edgeId) => edgeInteractionRef.current.onDeleteEdge(edgeId)}
          isInsertPending={props.id === edgeInteractionRef.current.edgeInsertPendingId}
        />
      ),
    }),
    []
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edgesWithType}
      nodeTypes={workflowNodeTypes}
      edgeTypes={edgeTypes}
      proOptions={{ hideAttribution: true }}
      defaultViewport={viewport}
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
    >
      <MiniMap />
      <Controls />
      <Background />
    </ReactFlow>
  )
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <WorkflowCanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  )
}
