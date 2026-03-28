"use client"

import { useCallback, useEffect, useMemo } from "react"

import { buildExpressionVariableCatalog } from "../../expression/variables"
import {
  useWorkflowShallowStore,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../../store"
import type { NodeKind, WorkflowNode } from "../../types"
import { EditorToolbar } from "../editor-toolbar"
import {
  createClipboardHotkeyHandler,
  createHistoryHotkeyHandler,
  isEscapeHotkey,
} from "../hotkeys"
import { NodeConfigPanel } from "../node-config-panel"
import { NodePalette } from "../node-palette"
import { WorkflowCanvas } from "../workflow-canvas"

function useUndoRedoHotkeys(onUndo: () => void, onRedo: () => void): void {
  useEffect(() => {
    const handler = createHistoryHotkeyHandler(onUndo, onRedo)
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onRedo, onUndo])
}

function useCancelInsertHotkey(onCancelInsert: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isEscapeHotkey(event)) {
        return
      }

      event.preventDefault()
      onCancelInsert()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onCancelInsert])
}

function useClipboardHotkeys(
  onCopy: () => Promise<boolean>,
  onPaste: () => Promise<boolean>
): void {
  useEffect(() => {
    const handler = createClipboardHotkeyHandler(
      () => {
        void onCopy()
      },
      () => {
        void onPaste()
      }
    )
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onCopy, onPaste])
}

export function WorkflowEditor() {
  const {
    undo,
    redo,
    copySelectionToClipboard,
    pasteFromClipboard,
    cancelQuickAdd,
    cancelEdgeInsert,
  } = useWorkflowShallowStore((state: WorkflowStoreState) => ({
    undo: state.undo,
    redo: state.redo,
    copySelectionToClipboard: state.copySelectionToClipboard,
    pasteFromClipboard: state.pasteFromClipboard,
    cancelQuickAdd: state.cancelQuickAdd,
    cancelEdgeInsert: state.cancelEdgeInsert,
  }))
  useUndoRedoHotkeys(undo, redo)
  useClipboardHotkeys(copySelectionToClipboard, pasteFromClipboard)
  useCancelInsertHotkey(() => {
    cancelQuickAdd()
    cancelEdgeInsert()
  })

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden rounded-md">
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
  const nodeCount = useWorkflowStore(
    (state: WorkflowStoreState) => state.history.present.nodes.length
  )
  const quickAddPending = useWorkflowStore(
    (state: WorkflowStoreState) => state.quickAddPending
  )
  const edgeInsertPending = useWorkflowStore(
    (state: WorkflowStoreState) => state.edgeInsertPending
  )
  const { addNode, confirmQuickAddNode, confirmEdgeInsertNode } =
    useWorkflowShallowStore((state: WorkflowStoreState) => ({
      addNode: state.addNode,
      confirmQuickAddNode: state.confirmQuickAddNode,
      confirmEdgeInsertNode: state.confirmEdgeInsertNode,
    }))

  const addNodeAtDefaultPosition = (kind: NodeKind) => {
    if (quickAddPending) {
      confirmQuickAddNode(kind)
      return
    }
    if (edgeInsertPending) {
      confirmEdgeInsertNode(kind)
      return
    }

    const offset = nodeCount * 20
    addNode(kind, { x: 80 + offset, y: 120 + offset })
  }

  return (
    <NodePalette
      onAddNode={addNodeAtDefaultPosition}
      quickAddActive={Boolean(quickAddPending || edgeInsertPending)}
    />
  )
}

function CanvasContainer() {
  const initialViewport = useWorkflowStore(
    (state: WorkflowStoreState) => state.history.present.viewport,
    () => true
  )
  const selectedNodeIds = useWorkflowStore(
    (state: WorkflowStoreState) => state.selectedNodeIds
  )
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setViewport,
    setSelectedNodes,
    addNode,
    cancelQuickAdd,
    cancelEdgeInsert,
    startEdgeInsertFromEdge,
    setLastPointerPosition,
    edgeInsertPending,
  } = useWorkflowShallowStore((state: WorkflowStoreState) => ({
    nodes: state.history.present.nodes,
    edges: state.history.present.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    setViewport: state.setViewport,
    setSelectedNodes: state.setSelectedNodes,
    addNode: state.addNode,
    cancelQuickAdd: state.cancelQuickAdd,
    cancelEdgeInsert: state.cancelEdgeInsert,
    startEdgeInsertFromEdge: state.startEdgeInsertFromEdge,
    setLastPointerPosition: state.setLastPointerPosition,
    edgeInsertPending: state.edgeInsertPending,
  }))
  const nodesWithSelection = useMemo(() => {
    const selectedIdSet = new Set(selectedNodeIds)
    let changed = false
    const nextNodes = nodes.map((node) => {
      const isSelected = selectedIdSet.has(node.id)
      if (Boolean(node.selected) === isSelected) {
        return node
      }

      changed = true
      return {
        ...node,
        selected: isSelected,
      }
    })
    return changed ? nextNodes : nodes
  }, [nodes, selectedNodeIds])
  const handlePaneClick = useCallback(() => {
    setSelectedNodes([])
    cancelQuickAdd()
    cancelEdgeInsert()
  }, [cancelEdgeInsert, cancelQuickAdd, setSelectedNodes])
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      onEdgesChange([{ id: edgeId, type: "remove" }])
    },
    [onEdgesChange]
  )

  return (
    <WorkflowCanvas
      nodes={nodesWithSelection}
      edges={edges}
      viewport={initialViewport}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onViewportChange={setViewport}
      onSelectNodes={setSelectedNodes}
      onPaneClick={handlePaneClick}
      onAddNodeAt={addNode}
      onStartInsertFromEdge={startEdgeInsertFromEdge}
      onDeleteEdge={handleDeleteEdge}
      onPointerFlowPosition={setLastPointerPosition}
      edgeInsertPendingId={edgeInsertPending?.edgeId ?? null}
    />
  )
}

function ConfigPanelContainer() {
  const nodes = useWorkflowStore(
    (state: WorkflowStoreState) => state.history.present.nodes
  )
  const edges = useWorkflowStore(
    (state: WorkflowStoreState) => state.history.present.edges
  )
  const selectedNodeIds = useWorkflowStore(
    (state: WorkflowStoreState) => state.selectedNodeIds
  )
  const { updateNodeLabel, updateNodeConfigField } = useWorkflowShallowStore(
    (state: WorkflowStoreState) => ({
      updateNodeLabel: state.updateNodeLabel,
      updateNodeConfigField: state.updateNodeConfigField,
    })
  )
  const selectedNodeId =
    selectedNodeIds.length === 1 ? (selectedNodeIds[0] ?? null) : null

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
