"use client"

import { useCallback, useMemo } from "react"

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
  edgeInsertPendingId,
}: WorkflowCanvasProps) {
  const reactFlow = useReactFlow<WorkflowNode, WorkflowEdge>()

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
  const edgesWithType = useMemo(
    () => edges.map((edge) => (edge.type ? edge : { ...edge, type: "workflow" })),
    [edges]
  )
  const edgeTypes = useMemo(
    () => ({
      workflow: (props: EdgeProps<WorkflowEdge>) => (
        <WorkflowEdgeComponent
          {...props}
          onStartInsert={onStartInsertFromEdge}
          onDeleteEdge={onDeleteEdge}
          isInsertPending={props.id === edgeInsertPendingId}
        />
      ),
    }),
    [edgeInsertPendingId, onDeleteEdge, onStartInsertFromEdge]
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
      onNodesChange={onNodesChange}
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
      onSelectionChange={({ nodes: selectedNodes }) =>
        onSelectNodes(selectedNodes.map((node) => node.id))
      }
      onPaneClick={onPaneClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
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
