"use client"

import { useEffect, useMemo } from "react"

import { EditorToolbar } from "./editor-toolbar"
import { createHistoryHotkeyHandler, isEscapeHotkey } from "./hotkeys"
import { NodeConfigPanel } from "./node-config-panel"
import { NodePalette } from "./node-palette"
import { WorkflowCanvas } from "./workflow-canvas"
import { buildExpressionVariableCatalog } from "../expression/variables"
import {
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

function useCancelQuickAddHotkey(onCancelQuickAdd: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isEscapeHotkey(event)) {
        return
      }

      event.preventDefault()
      onCancelQuickAdd()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onCancelQuickAdd])
}

export function WorkflowEditor() {
  const { undo, redo, cancelQuickAdd } = useWorkflowShallowStore((state: WorkflowStoreState) => ({
    undo: state.undo,
    redo: state.redo,
    cancelQuickAdd: state.cancelQuickAdd,
  }))
  useUndoRedoHotkeys(undo, redo)
  useCancelQuickAddHotkey(cancelQuickAdd)

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
  const nodeCount = useWorkflowStore((state: WorkflowStoreState) => state.history.present.nodes.length)
  const quickAddPending = useWorkflowStore((state: WorkflowStoreState) => state.quickAddPending)
  const { addNode, confirmQuickAddNode } = useWorkflowShallowStore(
    (state: WorkflowStoreState) => ({
      addNode: state.addNode,
      confirmQuickAddNode: state.confirmQuickAddNode,
    })
  )

  const addNodeAtDefaultPosition = (kind: NodeKind) => {
    if (quickAddPending) {
      confirmQuickAddNode(kind)
      return
    }

    const offset = nodeCount * 20
    addNode(kind, { x: 80 + offset, y: 120 + offset })
  }

  return <NodePalette onAddNode={addNodeAtDefaultPosition} quickAddActive={Boolean(quickAddPending)} />
}

function CanvasContainer() {
  const initialViewport = useWorkflowStore(
    (state: WorkflowStoreState) => state.history.present.viewport,
    () => true
  )
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setViewport, setSelectedNode, addNode, cancelQuickAdd } =
    useWorkflowShallowStore((state: WorkflowStoreState) => ({
      nodes: state.history.present.nodes,
      edges: state.history.present.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      setViewport: state.setViewport,
      setSelectedNode: state.setSelectedNode,
      addNode: state.addNode,
      cancelQuickAdd: state.cancelQuickAdd,
    }))

  return (
    <WorkflowCanvas
      nodes={nodes}
      edges={edges}
      viewport={initialViewport}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onViewportChange={setViewport}
      onSelectNode={setSelectedNode}
      onPaneClick={() => {
        setSelectedNode(null)
        cancelQuickAdd()
      }}
      onAddNodeAt={addNode}
    />
  )
}

function ConfigPanelContainer() {
  const nodes = useWorkflowStore((state: WorkflowStoreState) => state.history.present.nodes)
  const edges = useWorkflowStore((state: WorkflowStoreState) => state.history.present.edges)
  const selectedNodeId = useWorkflowStore((state: WorkflowStoreState) => state.selectedNodeId)
  const { updateNodeLabel, updateNodeConfigField } = useWorkflowShallowStore(
    (state: WorkflowStoreState) => ({
      updateNodeLabel: state.updateNodeLabel,
      updateNodeConfigField: state.updateNodeConfigField,
    })
  )

  const selectedNode = useMemo(
    () =>
      nodes.find((node: WorkflowNode) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  )
  const expressionVariables = useMemo(
    () => buildExpressionVariableCatalog(nodes, edges, selectedNodeId),
    [edges, nodes, selectedNodeId]
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
