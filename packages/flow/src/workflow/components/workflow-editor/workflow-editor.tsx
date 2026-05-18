"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { PlusIcon } from "lucide-react"
import {
  selectCanRedo,
  selectCanUndo,
  selectEdgeInsertPending,
  selectLastErrorMessage,
  selectNodeCount,
  selectPresentEdges,
  selectPresentNodes,
  selectQuickAddPending,
  selectVisibleGlobalValidationMessages,
  selectViewport,
  useWorkflowActions,
  useWorkflowGraph,
  useWorkflowSelection,
  useWorkflowShallowStore,
  useWorkflowStore,
  WorkflowStoreProvider,
  type WorkflowRuntimeConfig,
  type WorkflowStoreInitialProps,
  type WorkflowStoreState,
} from "../../store"
import type { NodeKind, WorkflowValidationSnapshot } from "../../types"
import { workflowEditorStyles } from "../../../styles/components/editor-shell"
import { EditorToolbar } from "../editor-toolbar"
import {
  createClipboardHotkeyHandler,
  createHistoryHotkeyHandler,
  createNodeEditHotkeyHandler,
  isEscapeHotkey,
} from "../hotkeys"
import { WorkflowEditorConfigPanel as WorkflowEditorConfigPanelBase } from "../node-config-panel"
import { NodePalette } from "../node-palette"
import { WorkflowCanvas } from "../workflow-canvas"
import type { WorkflowEditorAnchorRefs } from "../../tour"
import { useWorkflowEditorAnchorRef } from "../../tour/anchors"

interface WorkflowEditorLayoutContextValue {
  isPaletteOpen: boolean
  setIsPaletteOpen: (nextOpen: boolean) => void
  quickAddActive: boolean
  autoLayoutOnInit?: "after-measure"
  anchorRefs?: WorkflowEditorAnchorRefs
}

const WorkflowEditorLayoutContext =
  createContext<WorkflowEditorLayoutContextValue | null>(null)

function useWorkflowEditorLayoutContext() {
  return useContext(WorkflowEditorLayoutContext)
}

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

function useNodeEditHotkeys(
  onDuplicate: () => boolean,
  onDelete: () => boolean
): void {
  useEffect(() => {
    const handler = createNodeEditHotkeyHandler(
      () => {
        onDuplicate()
      },
      () => {
        onDelete()
      }
    )
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onDelete, onDuplicate])
}

function WorkflowEditorLayoutProvider({
  anchorRefs,
  autoLayoutOnInit,
  children,
}: PropsWithChildren<{
  anchorRefs?: WorkflowEditorAnchorRefs
  autoLayoutOnInit?: "after-measure"
}>) {
  const quickAddPending = useWorkflowStore(selectQuickAddPending)
  const edgeInsertPending = useWorkflowStore(selectEdgeInsertPending)
  const quickAddActive = Boolean(quickAddPending || edgeInsertPending)
  const [isPaletteOpen, setIsPaletteOpen] = useState(true)
  const {
    undo,
    redo,
    copySelectionToClipboard,
    pasteFromClipboard,
    duplicateNodes,
    deleteNodes,
    cancelQuickAdd,
    cancelEdgeInsert,
  } = useWorkflowShallowStore((state: WorkflowStoreState) => ({
    undo: state.undo,
    redo: state.redo,
    copySelectionToClipboard: state.copySelectionToClipboard,
    pasteFromClipboard: state.pasteFromClipboard,
    duplicateNodes: state.duplicateNodes,
    deleteNodes: state.deleteNodes,
    cancelQuickAdd: state.cancelQuickAdd,
    cancelEdgeInsert: state.cancelEdgeInsert,
  }))

  useUndoRedoHotkeys(undo, redo)
  useClipboardHotkeys(copySelectionToClipboard, pasteFromClipboard)
  useNodeEditHotkeys(duplicateNodes, deleteNodes)
  useCancelInsertHotkey(() => {
    cancelQuickAdd()
    cancelEdgeInsert()
  })

  useEffect(() => {
    if (quickAddActive) {
      setIsPaletteOpen(true)
    }
  }, [quickAddActive])

  return (
    <WorkflowEditorLayoutContext.Provider
      value={{
        isPaletteOpen,
        setIsPaletteOpen,
        quickAddActive,
        autoLayoutOnInit,
        anchorRefs,
      }}
    >
      {children}
    </WorkflowEditorLayoutContext.Provider>
  )
}

export interface WorkflowEditorProps extends WorkflowStoreInitialProps {
  runtime?: WorkflowRuntimeConfig
  validation?: WorkflowValidationSnapshot | null
  anchorRefs?: WorkflowEditorAnchorRefs
  autoLayoutOnInit?: "after-measure"
  children?: ReactNode
}

function DefaultWorkflowEditorComposition() {
  return (
    <>
      <WorkflowEditorToolbar />
      <WorkflowEditorBody>
        <WorkflowEditorValidationAlert />
        <WorkflowEditorPalette />
        <WorkflowEditorCanvas />
        <WorkflowEditorConfigPanel />
      </WorkflowEditorBody>
    </>
  )
}

function WorkflowEditorRoot({
  initialGraph,
  runtime,
  validation,
  anchorRefs,
  autoLayoutOnInit,
  children,
}: WorkflowEditorProps = {}) {
  const styles = workflowEditorStyles()
  const rootRef = useWorkflowEditorAnchorRef(anchorRefs, "root")

  return (
    <WorkflowStoreProvider initialGraph={initialGraph} runtime={runtime}>
      <WorkflowValidationSync validation={validation} />
      <WorkflowEditorLayoutProvider
        anchorRefs={anchorRefs}
        autoLayoutOnInit={autoLayoutOnInit}
      >
        <div ref={rootRef} className={styles.root()}>
          {children == null ? <DefaultWorkflowEditorComposition /> : children}
        </div>
      </WorkflowEditorLayoutProvider>
    </WorkflowStoreProvider>
  )
}

function WorkflowValidationSync({
  validation,
}: {
  validation?: WorkflowValidationSnapshot | null
}) {
  const setValidation = useWorkflowStore((state) => state.setValidation)

  useEffect(() => {
    setValidation(validation ?? null)
  }, [setValidation, validation])

  return null
}

export function WorkflowEditorToolbar() {
  const layout = useWorkflowEditorLayoutContext()
  const toolbarRef = useWorkflowEditorAnchorRef(layout?.anchorRefs, "toolbar")
  const {
    canUndo,
    canRedo,
    lastError,
    setLastError,
    undo,
    redo,
    exportDomain,
    importFromJson,
  } = useWorkflowShallowStore((state: WorkflowStoreState) => ({
    canUndo: selectCanUndo(state),
    canRedo: selectCanRedo(state),
    lastError: selectLastErrorMessage(state),
    setLastError: state.setLastError,
    undo: state.undo,
    redo: state.redo,
    exportDomain: state.exportDomain,
    importFromJson: state.importFromJson,
  }))

  return (
    <EditorToolbar
      anchorRef={toolbarRef}
      canUndo={canUndo}
      canRedo={canRedo}
      lastError={lastError}
      onUndo={undo}
      onRedo={redo}
      onClearError={() => setLastError(null)}
      onExportDomain={exportDomain}
      onImportJson={importFromJson}
    />
  )
}

export function WorkflowEditorBody({ children }: PropsWithChildren) {
  const styles = workflowEditorStyles()

  return <div className={styles.content()}>{children}</div>
}

export function WorkflowEditorValidationAlert() {
  const messages = useWorkflowStore(selectVisibleGlobalValidationMessages)
  const styles = workflowEditorStyles()

  if (messages.length === 0) {
    return null
  }

  const [firstMessage, ...additionalMessages] = messages

  return (
    <div className={styles.validationAlertWrap()}>
      <Alert
        variant="destructive"
        className={styles.validationAlert()}
        data-testid="workflow-validation-alert"
      >
        <AlertTitle>Workflow validation</AlertTitle>
        <AlertDescription>
          <div>{firstMessage?.message}</div>
          {additionalMessages.length > 0 ? (
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {additionalMessages.map((message) => (
                <li key={message.key}>{message.message}</li>
              ))}
            </ul>
          ) : null}
        </AlertDescription>
      </Alert>
    </div>
  )
}

export interface WorkflowEditorPaletteProps {
  open?: boolean
}

export function WorkflowEditorPalette({ open }: WorkflowEditorPaletteProps) {
  const layout = useWorkflowEditorLayoutContext()
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
      quickAddActive={
        layout?.quickAddActive ?? Boolean(quickAddPending || edgeInsertPending)
      }
      isOpen={open ?? layout?.isPaletteOpen ?? true}
      anchorRefs={layout?.anchorRefs}
    />
  )
}

export function WorkflowEditorCanvas() {
  const layout = useWorkflowEditorLayoutContext()
  const styles = workflowEditorStyles()
  const canvasRef = useWorkflowEditorAnchorRef(layout?.anchorRefs, "canvas")
  const paletteToggleRef = useWorkflowEditorAnchorRef(
    layout?.anchorRefs,
    "paletteToggle"
  )
  const captureOnce = () => true
  const initialViewport = useWorkflowStore(selectViewport, captureOnce)
  const { nodes, edges, edgeInsertPending } = useWorkflowShallowStore(
    (state: WorkflowStoreState) => ({
      nodes: selectPresentNodes(state),
      edges: selectPresentEdges(state),
      edgeInsertPending: selectEdgeInsertPending(state),
    })
  )
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    setViewport,
    setSelectedNodes,
    addNode,
    autoLayout,
    measuredInitialAutoLayout,
    cancelQuickAdd,
    cancelEdgeInsert,
    startEdgeInsertFromEdge,
    setLastPointerPosition,
  } = useWorkflowShallowStore((state: WorkflowStoreState) => ({
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    setViewport: state.setViewport,
    setSelectedNodes: state.setSelectedNodes,
    addNode: state.addNode,
    autoLayout: state.autoLayout,
    measuredInitialAutoLayout: state.measuredInitialAutoLayout,
    cancelQuickAdd: state.cancelQuickAdd,
    cancelEdgeInsert: state.cancelEdgeInsert,
    startEdgeInsertFromEdge: state.startEdgeInsertFromEdge,
    setLastPointerPosition: state.setLastPointerPosition,
  }))
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
  const isPaletteOpen = layout?.isPaletteOpen ?? true

  return (
    <div ref={canvasRef} className={styles.canvasWrap()}>
      <div className={styles.canvasOverlay()}>
        <div className={styles.canvasToolbar()}>
          <Button
            ref={paletteToggleRef}
            type="button"
            size="icon"
            variant="outline"
            aria-label={
              isPaletteOpen ? "Hide node palette" : "Show node palette"
            }
            onClick={() => layout?.setIsPaletteOpen(!isPaletteOpen)}
          >
            <PlusIcon
              className={
                isPaletteOpen
                  ? "rotate-45 transition-transform"
                  : "transition-transform"
              }
            />
          </Button>
        </div>
      </div>
      <WorkflowCanvas
        nodes={nodes}
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
        onAutoLayout={autoLayout}
        autoLayoutOnInit={layout?.autoLayoutOnInit}
        onMeasuredInitialAutoLayout={measuredInitialAutoLayout}
        anchorRefs={layout?.anchorRefs}
      />
    </div>
  )
}

export function WorkflowEditorConfigPanel() {
  const layout = useWorkflowEditorLayoutContext()
  const configPanelRef = useWorkflowEditorAnchorRef(
    layout?.anchorRefs,
    "configPanel"
  )

  return <WorkflowEditorConfigPanelBase anchorRef={configPanelRef} />
}

export const WorkflowEditor = Object.assign(WorkflowEditorRoot, {
  Toolbar: WorkflowEditorToolbar,
  ValidationAlert: WorkflowEditorValidationAlert,
  Body: WorkflowEditorBody,
  Palette: WorkflowEditorPalette,
  Canvas: WorkflowEditorCanvas,
  ConfigPanel: WorkflowEditorConfigPanel,
  use: {
    store: useWorkflowStore,
    shallowStore: useWorkflowShallowStore,
    graph: useWorkflowGraph,
    selection: useWorkflowSelection,
    actions: useWorkflowActions,
  },
})
