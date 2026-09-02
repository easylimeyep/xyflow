"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react"

import type { XYPosition } from "@xyflow/react"
import { Button } from "@flow/ui/components/button"
import { Alert, AlertDescription, AlertTitle } from "@flow/ui/components/alert"
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
import type {
  NodeKind,
  WorkflowCanvasMode,
  WorkflowRuntimeOverlay,
  WorkflowValidationSnapshot,
} from "../../types"
import { RuntimeObservationProvider } from "../../runtime"
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
  mode: WorkflowCanvasMode
  autoLayoutOnInit?: "after-measure"
  anchorRefs?: WorkflowEditorAnchorRefs
  getLastPointerFlowPosition: () => XYPosition | null
  setLastPointerFlowPosition: (position: XYPosition) => void
}

const WorkflowEditorLayoutContext =
  createContext<WorkflowEditorLayoutContextValue | null>(null)

function useWorkflowEditorLayoutContext() {
  return useContext(WorkflowEditorLayoutContext)
}

/**
 * The layout state shared by every editor part, exposed so a host that renders
 * its own parts (a bespoke palette toggle, a custom toolbar) reads the same
 * facts the built-in parts read instead of re-deriving them from the store.
 */
export interface WorkflowLayout {
  /** Whether the node palette is currently open. */
  isPaletteOpen: boolean
  /** Open or close the node palette. */
  setIsPaletteOpen: (open: boolean) => void
  /** True while a quick-add or edge-insert is waiting for a node kind. */
  quickAddActive: boolean
  /** The editor's interaction mode. */
  mode: WorkflowCanvasMode
}

/**
 * Read the editor's shared layout state. Must be called inside a
 * `WorkflowProvider` (which `WorkflowEditor` renders for you).
 */
export function useWorkflowLayout(): WorkflowLayout {
  const context = useWorkflowEditorLayoutContext()
  if (context == null) {
    throw new Error(
      "useWorkflowLayout must be used inside a WorkflowProvider (WorkflowEditor renders one)."
    )
  }

  const { isPaletteOpen, setIsPaletteOpen, quickAddActive, mode } = context
  return { isPaletteOpen, setIsPaletteOpen, quickAddActive, mode }
}

function useUndoRedoHotkeys(
  onUndo: () => void,
  onRedo: () => void,
  enabled: boolean
): void {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handler = createHistoryHotkeyHandler(onUndo, onRedo)
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [enabled, onRedo, onUndo])
}

function useCancelInsertHotkey(
  onCancelInsert: () => void,
  enabled: boolean
): void {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isEscapeHotkey(event)) {
        return
      }

      event.preventDefault()
      onCancelInsert()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [enabled, onCancelInsert])
}

function useClipboardHotkeys(
  onCopy: () => Promise<boolean>,
  onPaste: () => Promise<boolean>,
  enabled: boolean
): void {
  useEffect(() => {
    if (!enabled) {
      return
    }

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
  }, [enabled, onCopy, onPaste])
}

function useNodeEditHotkeys(
  onDuplicate: () => boolean,
  onDelete: () => boolean,
  enabled: boolean
): void {
  useEffect(() => {
    if (!enabled) {
      return
    }

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
  }, [enabled, onDelete, onDuplicate])
}

function WorkflowEditorLayoutProvider({
  anchorRefs,
  autoLayoutOnInit,
  mode,
  getLastPointerFlowPosition,
  setLastPointerFlowPosition,
  children,
}: PropsWithChildren<{
  anchorRefs?: WorkflowEditorAnchorRefs
  autoLayoutOnInit?: "after-measure"
  mode: WorkflowCanvasMode
  getLastPointerFlowPosition: () => XYPosition | null
  setLastPointerFlowPosition: (position: XYPosition) => void
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
  const pasteSelectionNearPointer = useCallback(
    () => pasteFromClipboard(getLastPointerFlowPosition()),
    [getLastPointerFlowPosition, pasteFromClipboard]
  )

  // Editing hotkeys mutate the graph or history, so they are disabled while
  // observing a run — the canvas gating alone would not stop a global keydown.
  const editingEnabled = mode === "edit"
  useUndoRedoHotkeys(undo, redo, editingEnabled)
  useClipboardHotkeys(
    copySelectionToClipboard,
    pasteSelectionNearPointer,
    editingEnabled
  )
  useNodeEditHotkeys(duplicateNodes, deleteNodes, editingEnabled)
  useCancelInsertHotkey(() => {
    cancelQuickAdd()
    cancelEdgeInsert()
  }, editingEnabled)

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
        mode,
        autoLayoutOnInit,
        anchorRefs,
        getLastPointerFlowPosition,
        setLastPointerFlowPosition,
      }}
    >
      {children}
    </WorkflowEditorLayoutContext.Provider>
  )
}

export interface WorkflowProviderProps extends WorkflowStoreInitialProps {
  runtime?: WorkflowRuntimeConfig
  validation?: WorkflowValidationSnapshot | null
  anchorRefs?: WorkflowEditorAnchorRefs
  autoLayoutOnInit?: "after-measure"
  /**
   * Canvas interaction mode. Defaults to `"edit"`. `"observe"` makes the whole
   * editor read-only and swaps the config panel for the runtime inspector.
   */
  mode?: WorkflowCanvasMode
  /**
   * Externally supplied runtime overlay rendered while observing a run. Passed
   * as a prop (never through the store) so status updates never reach the undo
   * history. A partial overlay is fine — unlisted nodes render neutrally.
   */
  overlay?: WorkflowRuntimeOverlay
  children?: ReactNode
}

/**
 * `WorkflowEditor` and `WorkflowProvider` take the same props; the editor adds
 * only the default layout shell around them.
 */
export type WorkflowEditorProps = WorkflowProviderProps

function DefaultWorkflowEditorComposition() {
  return (
    <>
      <WorkflowEditorToolbar />
      <WorkflowEditorBody>
        <WorkflowEditorValidationAlert />
        <WorkflowEditorConfigPanel />
        <WorkflowEditorPalette />
        <WorkflowEditorCanvas />
      </WorkflowEditorBody>
    </>
  )
}

/**
 * Headless editor context — the store, runtime observation, and shared layout
 * state — with no markup of its own. Render this directly to own the whole
 * layout, arranging `WorkflowEditor.*` parts inside your own DOM. For the
 * default shell, render `WorkflowEditor` instead, which wraps this.
 */
export function WorkflowProvider({
  initialGraph,
  runtime,
  definitions,
  validation,
  anchorRefs,
  autoLayoutOnInit,
  mode = "edit",
  overlay,
  children,
}: WorkflowProviderProps = {}) {
  const lastPointerFlowPositionRef = useRef<XYPosition | null>(null)
  const getLastPointerFlowPosition = useCallback(
    () => lastPointerFlowPositionRef.current,
    []
  )
  const setLastPointerFlowPosition = useCallback((position: XYPosition) => {
    lastPointerFlowPositionRef.current = {
      x: position.x,
      y: position.y,
    }
  }, [])

  return (
    <WorkflowStoreProvider
      initialGraph={initialGraph}
      runtime={runtime}
      definitions={definitions}
    >
      <WorkflowValidationSync validation={validation} />
      <RuntimeObservationProvider mode={mode} overlay={overlay}>
        <WorkflowEditorLayoutProvider
          anchorRefs={anchorRefs}
          autoLayoutOnInit={autoLayoutOnInit}
          mode={mode}
          getLastPointerFlowPosition={getLastPointerFlowPosition}
          setLastPointerFlowPosition={setLastPointerFlowPosition}
        >
          {children}
        </WorkflowEditorLayoutProvider>
      </RuntimeObservationProvider>
    </WorkflowStoreProvider>
  )
}

function WorkflowEditorRoot(props: WorkflowEditorProps = {}) {
  const { children, ...providerProps } = props
  const styles = workflowEditorStyles()
  const rootRef = useWorkflowEditorAnchorRef(providerProps.anchorRefs, "root")

  return (
    <WorkflowProvider {...providerProps}>
      <div ref={rootRef} className={styles.root()}>
        {children == null ? <DefaultWorkflowEditorComposition /> : children}
      </div>
    </WorkflowProvider>
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

export interface WorkflowEditorToolbarProps {
  /** Extra classes for the toolbar's root element, merged into the package's own. */
  className?: string
}

export function WorkflowEditorToolbar({
  className,
}: WorkflowEditorToolbarProps = {}) {
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
      className={className}
    />
  )
}

export interface WorkflowEditorBodyProps extends PropsWithChildren {
  /** Extra classes for the body element, merged into the package's own. */
  readonly className?: string
}

export function WorkflowEditorBody({
  children,
  className,
}: WorkflowEditorBodyProps) {
  const styles = workflowEditorStyles()

  return (
    <div
      className={styles.content({ class: className })}
      data-testid="workflow-editor-body"
    >
      {children}
    </div>
  )
}

export interface WorkflowEditorValidationAlertProps {
  /** Extra classes for the alert's wrapper element, merged into the package's own. */
  className?: string
}

export function WorkflowEditorValidationAlert({
  className,
}: WorkflowEditorValidationAlertProps = {}) {
  const messages = useWorkflowStore(selectVisibleGlobalValidationMessages)
  const styles = workflowEditorStyles()

  if (messages.length === 0) {
    return null
  }

  const [firstMessage, ...additionalMessages] = messages

  return (
    <div className={styles.validationAlertWrap({ class: className })}>
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
  /** Extra classes for the palette's aside element, merged into the package's own. */
  className?: string
  /**
   * Where the palette sits. `floating` pins it over the canvas at the right,
   * which is the package's historical layout. `inline` renders it in flow, so
   * the host can give it a lane in its own grid or flex row.
   */
  placement?: "floating" | "inline"
}

export function WorkflowEditorPalette({
  open,
  className,
  placement,
}: WorkflowEditorPaletteProps) {
  const layout = useWorkflowEditorLayoutContext()
  const nodeCount = useWorkflowStore(selectNodeCount)
  const isObserving = layout?.mode === "observe"
  const quickAddPending = useWorkflowStore(selectQuickAddPending)
  const edgeInsertPending = useWorkflowStore(selectEdgeInsertPending)
  const { addNode, confirmQuickAddNode, confirmEdgeInsertNode } =
    useWorkflowShallowStore((state: WorkflowStoreState) => ({
      addNode: state.addNode,
      confirmQuickAddNode: state.confirmQuickAddNode,
      confirmEdgeInsertNode: state.confirmEdgeInsertNode,
    }))

  // The palette only exists to add nodes, which is a mutation — withhold it
  // entirely while observing a run.
  if (isObserving) {
    return null
  }

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
      className={className}
      placement={placement}
    />
  )
}

export interface WorkflowEditorCanvasProps {
  /** Extra classes for the canvas wrapper element, merged into the package's own. */
  className?: string
  /**
   * When `true`, the canvas refits its viewport whenever its own box
   * resizes. Defaults to `false`; a host whose layout can resize the
   * canvas (resizable panes, collapsible sidebars, etc.) opts in.
   */
  refitOnResize?: boolean
}

export function WorkflowEditorCanvas({
  className,
  refitOnResize,
}: WorkflowEditorCanvasProps = {}) {
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
  const setLastPointerFlowPosition = layout?.setLastPointerFlowPosition
  const handlePointerFlowPosition = useCallback(
    (position: XYPosition) => {
      setLastPointerFlowPosition?.(position)
    },
    [setLastPointerFlowPosition]
  )

  const isObserving = layout?.mode === "observe"

  return (
    <div
      ref={canvasRef}
      className={styles.canvasWrap({ class: className })}
      data-testid="workflow-editor-canvas"
    >
      {isObserving ? null : (
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
      )}
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
        onPointerFlowPosition={handlePointerFlowPosition}
        edgeInsertPendingId={edgeInsertPending?.edgeId ?? null}
        onAutoLayout={autoLayout}
        autoLayoutOnInit={layout?.autoLayoutOnInit}
        onMeasuredInitialAutoLayout={measuredInitialAutoLayout}
        anchorRefs={layout?.anchorRefs}
        mode={layout?.mode ?? "edit"}
        refitOnResize={refitOnResize}
      />
    </div>
  )
}

export interface WorkflowEditorConfigPanelProps {
  /**
   * Which edge of its lane the panel borders. `left` (default) reads as a left
   * rail; `right` mirrors the border for a host that composes the panel on the
   * right of the canvas. Symmetrical with the palette's `placement`.
   */
  side?: "left" | "right"
  /** Extra classes for the config panel's aside element, merged into the package's own. */
  className?: string
}

export function WorkflowEditorConfigPanel({
  side,
  className,
}: WorkflowEditorConfigPanelProps = {}) {
  const layout = useWorkflowEditorLayoutContext()
  const configPanelRef = useWorkflowEditorAnchorRef(
    layout?.anchorRefs,
    "configPanel"
  )

  return (
    <WorkflowEditorConfigPanelBase
      anchorRef={configPanelRef}
      mode={layout?.mode ?? "edit"}
      side={side}
      className={className}
    />
  )
}

export const WorkflowEditor = Object.assign(WorkflowEditorRoot, {
  Provider: WorkflowProvider,
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
    layout: useWorkflowLayout,
  },
})
