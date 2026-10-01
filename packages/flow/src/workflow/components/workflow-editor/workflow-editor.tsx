"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type PropsWithChildren,
  type ReactNode,
} from "react"

import { useHistory } from "@ez-kit/zu-store"
import type { XYPosition } from "@xyflow/react"
import { Button } from "@flow/ui/components/button"
import { Alert, AlertDescription, AlertTitle } from "@flow/ui/components/alert"
import { PlusIcon } from "lucide-react"
import {
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
  useWorkflowStoreApi,
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
  isSearchHotkey,
} from "../hotkeys"
import { WorkflowEditorConfigPanel as WorkflowEditorConfigPanelBase } from "../node-config-panel"
import { NodePalette } from "../node-palette"
import { WorkflowCanvas, type RevealNode } from "../workflow-canvas"
import { WorkflowSearch, type WorkflowSearchPosition } from "../workflow-search"
import type { WorkflowEditorAnchorRefs } from "../../tour"
import { useWorkflowEditorAnchorRef } from "../../tour/anchors"

interface WorkflowEditorLayoutContextValue {
  isPaletteOpen: boolean
  setIsPaletteOpen: (nextOpen: boolean) => void
  isPaletteVisible: boolean
  quickAddActive: boolean
  mode: WorkflowCanvasMode
  autoLayoutOnInit?: "after-measure"
  anchorRefs?: WorkflowEditorAnchorRefs
  getLastPointerFlowPosition: () => XYPosition | null
  setLastPointerFlowPosition: (position: XYPosition) => void
  /** Centers the mounted canvas on a node; a no-op while no canvas is mounted. */
  revealNode: RevealNode
  setRevealNode: (revealNode: RevealNode | null) => void
  /** Focuses and selects the search query; a no-op without a search part. */
  focusSearch: () => void
  /** True while a search part is mounted to receive Mod+F. */
  hasSearch: () => boolean
  setFocusSearch: (focus: (() => void) | null) => void
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
  /**
   * The user's open choice for the node palette, changed only by a toggle.
   * A pending quick-add borrows the palette without touching it; read
   * `isPaletteVisible` for what is on screen.
   */
  isPaletteOpen: boolean
  /** Open or close the node palette. */
  setIsPaletteOpen: (open: boolean) => void
  /**
   * Whether the node palette is on screen: open by choice, or shown for the
   * duration of a pending quick-add or edge-insert.
   */
  isPaletteVisible: boolean
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

  const {
    isPaletteOpen,
    setIsPaletteOpen,
    isPaletteVisible,
    quickAddActive,
    mode,
  } = context
  return {
    isPaletteOpen,
    setIsPaletteOpen,
    isPaletteVisible,
    quickAddActive,
    mode,
  }
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

  // A pending insertion borrows the palette as its picker, so it is derived
  // here rather than written into the user's open choice.
  const isPaletteVisible = isPaletteOpen || quickAddActive

  // The canvas and the search bar hand their imperative entry points over
  // through refs: the search may render outside the React Flow provider, and
  // neither registration should re-render the parts reading this context.
  const revealNodeRef = useRef<RevealNode | null>(null)
  const setRevealNode = useCallback((next: RevealNode | null) => {
    revealNodeRef.current = next
  }, [])
  const revealNode = useCallback((nodeId: string) => {
    revealNodeRef.current?.(nodeId)
  }, [])
  const focusSearchRef = useRef<(() => void) | null>(null)
  const setFocusSearch = useCallback((next: (() => void) | null) => {
    focusSearchRef.current = next
  }, [])
  const focusSearch = useCallback(() => {
    focusSearchRef.current?.()
  }, [])
  const hasSearch = useCallback(() => focusSearchRef.current != null, [])

  return (
    <WorkflowEditorLayoutContext.Provider
      value={{
        isPaletteOpen,
        setIsPaletteOpen,
        isPaletteVisible,
        quickAddActive,
        mode,
        autoLayoutOnInit,
        anchorRefs,
        getLastPointerFlowPosition,
        setLastPointerFlowPosition,
        revealNode,
        setRevealNode,
        focusSearch,
        hasSearch,
        setFocusSearch,
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
        <WorkflowEditorCanvas>
          <WorkflowEditorSearch />
        </WorkflowEditorCanvas>
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

  return (
    <WorkflowProvider {...providerProps}>
      <WorkflowEditorShell anchorRefs={providerProps.anchorRefs}>
        {children == null ? <DefaultWorkflowEditorComposition /> : children}
      </WorkflowEditorShell>
    </WorkflowProvider>
  )
}

/**
 * The editor's root element. `Mod+F` is bound here rather than on `window`, so
 * it opens the canvas search only while focus is inside this editor and leaves
 * the browser's own find alone everywhere else. It is bound in every mode:
 * searching reads the graph and never changes it.
 */
function WorkflowEditorShell({
  anchorRefs,
  children,
}: PropsWithChildren<{ anchorRefs?: WorkflowEditorAnchorRefs }>) {
  const styles = workflowEditorStyles()
  const rootRef = useWorkflowEditorAnchorRef(anchorRefs, "root")
  const layout = useWorkflowEditorLayoutContext()
  const storeApi = useWorkflowStoreApi()
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    // A composition without a search part leaves the key to the browser.
    if (!isSearchHotkey(event.nativeEvent) || !layout?.hasSearch()) {
      return
    }

    event.preventDefault()
    if (storeApi.getState().search.isOpen) {
      layout.focusSearch()
      return
    }
    storeApi.getState().openSearch()
  }
  // The pane, the canvas region and the editor chrome are not focusable, so a
  // click on empty canvas would otherwise leave focus on the body — outside
  // the editor, where Mod+F never reaches `onKeyDown`. Pulling focus to the
  // root keeps "focus is inside the editor" true for any click inside it; a
  // focusable target (an input, a node) still takes focus itself afterwards.
  const onPointerDownCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const root = event.currentTarget
    if (!root.contains(document.activeElement)) {
      root.focus({ preventScroll: true })
    }
  }

  return (
    <div
      ref={rootRef}
      className={styles.root()}
      tabIndex={-1}
      data-workflow-editor-root=""
      onKeyDown={onKeyDown}
      onPointerDownCapture={onPointerDownCapture}
    >
      {children}
    </div>
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
  // `withHistory` keeps the stacks in a sub-store of their own, so these two
  // subscribe to history alone — a graph edit that records nothing leaves the
  // toolbar untouched.
  const { canUndo, canRedo } = useHistory(useWorkflowStoreApi())
  const { lastError, setLastError, undo, redo, exportDomain, importFromJson } =
    useWorkflowShallowStore((state: WorkflowStoreState) => ({
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
  // The node count only decides where a palette-added node lands, which is
  // read once per click. Selecting it would re-render the whole palette on
  // every node added or removed anywhere on the canvas.
  const storeApi = useWorkflowStoreApi()
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

  const quickAddActive =
    layout?.quickAddActive ?? Boolean(quickAddPending || edgeInsertPending)

  const addNodeAtDefaultPosition = (kind: NodeKind) => {
    if (quickAddPending) {
      confirmQuickAddNode(kind)
      return
    }
    if (edgeInsertPending) {
      confirmEdgeInsertNode(kind)
      return
    }

    const offset = selectNodeCount(storeApi.getState()) * 20
    addNode(kind, { x: 80 + offset, y: 120 + offset })
  }

  return (
    <NodePalette
      onAddNode={addNodeAtDefaultPosition}
      quickAddActive={quickAddActive}
      // A host's `open` is its open choice, like the toggle's; a pending
      // insertion shows the palette over it either way.
      isOpen={(open ?? layout?.isPaletteOpen ?? true) || quickAddActive}
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
  /**
   * Rendered over the canvas, inside its box: floating parts such as
   * `WorkflowEditor.Search` position against the canvas rather than the body.
   */
  children?: ReactNode
}

export function WorkflowEditorCanvas({
  className,
  refitOnResize,
  children,
}: WorkflowEditorCanvasProps = {}) {
  const layout = useWorkflowEditorLayoutContext()
  const styles = workflowEditorStyles()
  const canvasRef = useWorkflowEditorAnchorRef(layout?.anchorRefs, "canvas")
  const paletteToggleRef = useWorkflowEditorAnchorRef(
    layout?.anchorRefs,
    "paletteToggle"
  )
  // The canvas owns the viewport after mount, so this is a one-time read: it
  // takes the value off the store handle instead of subscribing to it.
  const workflowStoreApi = useWorkflowStoreApi()
  const [initialViewport] = useState(() =>
    selectViewport(workflowStoreApi.getState())
  )
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
        onRevealNodeChange={layout?.setRevealNode}
      />
      {children}
    </div>
  )
}

export interface WorkflowEditorSearchProps {
  /**
   * `floating` (default) pins the bar over the canvas at `position`;
   * `inline` renders it in flow for a host that lays it out itself.
   */
  placement?: "floating" | "inline"
  /**
   * Where a floating bar sits: `top-left`, `top-center`, `top-right`
   * (default), `center-left`, `center-right`, `bottom-left`, `bottom-center`
   * or `bottom-right`. Along the bottom edge the results open upwards.
   */
  position?: WorkflowSearchPosition
  /** Extra classes for the search bar's root element, merged into the package's own. */
  className?: string
}

/**
 * The canvas find bar. Opens with `Mod+F` inside the editor, in both edit and
 * observe modes, and reveals each match on whichever canvas is mounted.
 */
export function WorkflowEditorSearch({
  placement,
  position,
  className,
}: WorkflowEditorSearchProps = {}) {
  const layout = useWorkflowEditorLayoutContext()

  return (
    <WorkflowSearch
      onRevealNode={layout?.revealNode}
      onRegisterFocus={layout?.setFocusSearch}
      placement={placement}
      position={position}
      // The palette is withheld while observing, whatever its open flag says.
      besidePalette={layout?.mode === "edit" && layout.isPaletteOpen}
      className={className}
    />
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
  Search: WorkflowEditorSearch,
  use: {
    store: useWorkflowStore,
    shallowStore: useWorkflowShallowStore,
    graph: useWorkflowGraph,
    selection: useWorkflowSelection,
    actions: useWorkflowActions,
    layout: useWorkflowLayout,
  },
})
