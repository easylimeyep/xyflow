"use client"

import { useCallback, useEffect, useMemo } from "react"

import {
  selectCanRedo,
  selectCanUndo,
  selectEdgeInsertPending,
  selectExpressionVariablesForNode,
  selectLastErrorMessage,
  selectNodeCount,
  selectPresentEdges,
  selectPresentNodes,
  selectQuickAddPending,
  selectSelectedNode,
  selectSelectedNodeIds,
  selectViewport,
  useWorkflowShallowStore,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../../store"
import type { NodeKind } from "../../types"
import { workflowEditorStyles } from "../../../styles/components/editor-shell"
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
  const styles = workflowEditorStyles()

  return (
    <div className={styles.root()}>
      <ToolbarContainer />

      <div className={styles.content()}>
        <PaletteContainer />
        <div className={styles.canvasWrap()}>
          <CanvasContainer />
        </div>
        <ConfigPanelContainer />
      </div>
    </div>
  )
}

function ToolbarContainer() {
  const {
    canUndo,
    canRedo,
    lastError,
    setLastError,
    undo,
    redo,
    exportInternal,
    exportDomain,
    importFromJson,
  } = useWorkflowShallowStore((state: WorkflowStoreState) => ({
    canUndo: selectCanUndo(state),
    canRedo: selectCanRedo(state),
    lastError: selectLastErrorMessage(state),
    setLastError: state.setLastError,
    undo: state.undo,
    redo: state.redo,
    exportInternal: state.exportInternal,
    exportDomain: state.exportDomain,
    importFromJson: state.importFromJson,
  }))

  return (
    <EditorToolbar
      canUndo={canUndo}
      canRedo={canRedo}
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
  const nodeCount = useWorkflowStore(selectNodeCount)
  const quickAddPending = useWorkflowStore(selectQuickAddPending)
  const edgeInsertPending = useWorkflowStore(selectEdgeInsertPending)
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
  const initialViewport = useWorkflowStore(selectViewport, () => true)
  const selectedNodeIds = useWorkflowStore(selectSelectedNodeIds)
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
    nodes: selectPresentNodes(state),
    edges: selectPresentEdges(state),
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
  const selectedNode = useWorkflowStore(selectSelectedNode)
  const expressionVariables = useWorkflowStore((state: WorkflowStoreState) =>
    selectExpressionVariablesForNode(state, selectedNode?.id ?? null)
  )
  const { updateNodeLabel, updateNodeConfig } = useWorkflowShallowStore(
    (state: WorkflowStoreState) => ({
      updateNodeLabel: state.updateNodeLabel,
      updateNodeConfig: state.updateNodeConfig,
    })
  )

  return (
    <NodeConfigPanel
      selectedNode={selectedNode}
      expressionVariables={expressionVariables}
      onUpdateLabel={updateNodeLabel}
      onUpdateConfigField={updateNodeConfig}
    />
  )
}
