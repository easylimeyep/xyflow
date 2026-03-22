"use client"

import { useCallback } from "react"

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type Viewport,
  type XYPosition,
} from "@xyflow/react"

import { WORKFLOW_NODE_KIND_MIME } from "../dnd"
import { workflowNodeTypes } from "../nodes/node-types"
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
  onSelectNode: (nodeId: string | null) => void
  onAddNodeAt: (kind: NodeKind, position: XYPosition) => void
}

function WorkflowCanvasInner({
  nodes,
  edges,
  viewport,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onViewportChange,
  onSelectNode,
  onAddNodeAt,
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

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={workflowNodeTypes}
      defaultViewport={viewport}
      onMoveEnd={(_, nextViewport) => onViewportChange(nextViewport)}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={(connection) =>
        validateConnection(connection, nodes, edges).valid
      }
      onSelectionChange={({ nodes: selectedNodes }) =>
        onSelectNode(selectedNodes[0]?.id ?? null)
      }
      onPaneClick={() => onSelectNode(null)}
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
