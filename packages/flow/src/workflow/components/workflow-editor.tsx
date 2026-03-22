"use client"

import { useEffect, useMemo } from "react"

import { EditorToolbar } from "./editor-toolbar"
import { createHistoryHotkeyHandler } from "./hotkeys"
import { NodeConfigPanel } from "./node-config-panel"
import { NodePalette } from "./node-palette"
import { WorkflowCanvas } from "./workflow-canvas"
import { buildExpressionVariableCatalog } from "../expression/variables"
import { useWorkflowGraph, useWorkflowStore, type WorkflowStoreState } from "../store"
import type { NodeKind, WorkflowNode } from "../types"

function useUndoRedoHotkeys(onUndo: () => void, onRedo: () => void): void {
  useEffect(() => {
    const handler = createHistoryHotkeyHandler(onUndo, onRedo)
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onRedo, onUndo])
}

export function WorkflowEditor() {
  const graph = useWorkflowGraph()
  const history = useWorkflowStore((state: WorkflowStoreState) => state.history)
  const selectedNodeId = useWorkflowStore(
    (state: WorkflowStoreState) => state.selectedNodeId
  )
  const lastError = useWorkflowStore((state: WorkflowStoreState) => state.lastError)
  const setLastError = useWorkflowStore(
    (state: WorkflowStoreState) => state.setLastError
  )
  const addNode = useWorkflowStore((state: WorkflowStoreState) => state.addNode)
  const setSelectedNode = useWorkflowStore(
    (state: WorkflowStoreState) => state.setSelectedNode
  )
  const updateNodeLabel = useWorkflowStore(
    (state: WorkflowStoreState) => state.updateNodeLabel
  )
  const updateNodeConfigField = useWorkflowStore(
    (state: WorkflowStoreState) => state.updateNodeConfigField
  )
  const onNodesChange = useWorkflowStore(
    (state: WorkflowStoreState) => state.onNodesChange
  )
  const onEdgesChange = useWorkflowStore(
    (state: WorkflowStoreState) => state.onEdgesChange
  )
  const onConnect = useWorkflowStore((state: WorkflowStoreState) => state.onConnect)
  const onMoveEnd = useWorkflowStore((state: WorkflowStoreState) => state.onMoveEnd)
  const undo = useWorkflowStore((state: WorkflowStoreState) => state.undo)
  const redo = useWorkflowStore((state: WorkflowStoreState) => state.redo)
  const exportInternal = useWorkflowStore(
    (state: WorkflowStoreState) => state.exportInternal
  )
  const exportDomain = useWorkflowStore(
    (state: WorkflowStoreState) => state.exportDomain
  )
  const importFromJson = useWorkflowStore(
    (state: WorkflowStoreState) => state.importFromJson
  )

  const selectedNode = useMemo(
    () =>
      graph.nodes.find((node: WorkflowNode) => node.id === selectedNodeId) ?? null,
    [graph.nodes, selectedNodeId]
  )
  const expressionVariables = useMemo(
    () => buildExpressionVariableCatalog(graph.nodes, graph.edges, selectedNodeId),
    [graph.edges, graph.nodes, selectedNodeId]
  )

  useUndoRedoHotkeys(undo, redo)

  const addNodeAtDefaultPosition = (kind: NodeKind) => {
    const offset = graph.nodes.length * 20
    addNode(kind, { x: 80 + offset, y: 120 + offset })
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <EditorToolbar
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        lastError={lastError}
        onUndo={undo}
        onRedo={redo}
        onClearError={() => setLastError(null)}
        onExportInternal={exportInternal}
        onExportDomain={exportDomain}
        onImportJson={importFromJson}
      />

      <div className="flex min-h-0 flex-1">
        <NodePalette onAddNode={addNodeAtDefaultPosition} />
        <div className="min-h-0 flex-1">
          <WorkflowCanvas
            nodes={graph.nodes}
            edges={graph.edges}
            viewport={graph.viewport}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onMoveEnd={onMoveEnd}
            onSelectNode={setSelectedNode}
            onAddNodeAt={addNode}
          />
        </div>
        <NodeConfigPanel
          selectedNode={selectedNode}
          expressionVariables={expressionVariables}
          onUpdateLabel={updateNodeLabel}
          onUpdateConfigField={updateNodeConfigField}
        />
      </div>
    </div>
  )
}
