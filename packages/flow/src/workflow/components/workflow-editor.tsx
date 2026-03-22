"use client"

import { useEffect, useMemo } from "react"

import { EditorToolbar } from "./editor-toolbar"
import { createHistoryHotkeyHandler } from "./hotkeys"
import { NodeConfigPanel } from "./node-config-panel"
import { NodePalette } from "./node-palette"
import { WorkflowCanvas } from "./workflow-canvas"
import { buildExpressionVariableCatalog } from "../expression/variables"
import {
  useWorkflowGraph,
  useWorkflowShallowStore,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../store"
import type { NodeKind, WorkflowNode } from "../types"

function useUndoRedoHotkeys(onUndo: () => void, onRedo: () => void): void {
  useEffect(() => {
    const handler = createHistoryHotkeyHandler(onUndo, onRedo)
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onRedo, onUndo])
}

export function WorkflowEditor() {
  const { undo, redo } = useWorkflowShallowStore((state: WorkflowStoreState) => ({
    undo: state.undo,
    redo: state.redo,
  }))
  useUndoRedoHotkeys(undo, redo)

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <ToolbarContainer />

      <div className="flex min-h-0 flex-1">
        <PaletteContainer />
        <div className="min-h-0 flex-1">
          <CanvasContainer />
        </div>
        <ConfigPanelContainer />
      </div>
    </div>
  )
}

function ToolbarContainer() {
  const {
    history,
    lastError,
    setLastError,
    undo,
    redo,
    exportInternal,
    exportDomain,
    importFromJson,
  } = useWorkflowShallowStore((state: WorkflowStoreState) => ({
    history: state.history,
    lastError: state.lastError,
    setLastError: state.setLastError,
    undo: state.undo,
    redo: state.redo,
    exportInternal: state.exportInternal,
    exportDomain: state.exportDomain,
    importFromJson: state.importFromJson,
  }))

  return (
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
  )
}

function PaletteContainer() {
  const graph = useWorkflowGraph()
  const addNode = useWorkflowStore((state: WorkflowStoreState) => state.addNode)

  const addNodeAtDefaultPosition = (kind: NodeKind) => {
    const offset = graph.nodes.length * 20
    addNode(kind, { x: 80 + offset, y: 120 + offset })
  }

  return <NodePalette onAddNode={addNodeAtDefaultPosition} />
}

function CanvasContainer() {
  const graph = useWorkflowGraph()
  const { onNodesChange, onEdgesChange, onConnect, setViewport, setSelectedNode, addNode } =
    useWorkflowShallowStore((state: WorkflowStoreState) => ({
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      setViewport: state.setViewport,
      setSelectedNode: state.setSelectedNode,
      addNode: state.addNode,
    }))

  return (
    <WorkflowCanvas
      nodes={graph.nodes}
      edges={graph.edges}
      viewport={graph.viewport}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onViewportChange={setViewport}
      onSelectNode={setSelectedNode}
      onAddNodeAt={addNode}
    />
  )
}

function ConfigPanelContainer() {
  const graph = useWorkflowGraph()
  const selectedNodeId = useWorkflowStore((state: WorkflowStoreState) => state.selectedNodeId)
  const { updateNodeLabel, updateNodeConfigField } = useWorkflowShallowStore(
    (state: WorkflowStoreState) => ({
      updateNodeLabel: state.updateNodeLabel,
      updateNodeConfigField: state.updateNodeConfigField,
    })
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

  return (
    <NodeConfigPanel
      selectedNode={selectedNode}
      expressionVariables={expressionVariables}
      onUpdateLabel={updateNodeLabel}
      onUpdateConfigField={updateNodeConfigField}
    />
  )
}
