"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import type {
  NodeRuntimeState,
  WorkflowCanvasMode,
  WorkflowRuntimeOverlay,
} from "../types"

export interface EdgeRuntimeState {
  traversed: boolean
  active: boolean
}

interface RuntimeObservationStore {
  mode: WorkflowCanvasMode
  getNodeState: (nodeId: string) => NodeRuntimeState | undefined
  getEdgeState: (edgeId: string) => EdgeRuntimeState
  subscribe: (listener: () => void) => () => void
}

const RuntimeObservationContext = createContext<RuntimeObservationStore | null>(
  null
)

const NEUTRAL_EDGE_STATE: EdgeRuntimeState = { traversed: false, active: false }

function noopSubscribe(): () => void {
  return () => {}
}

function isSameNodeRuntimeState(
  a: NodeRuntimeState | undefined,
  b: NodeRuntimeState | undefined
): boolean {
  if (a === b) {
    return true
  }
  if (!a || !b) {
    return false
  }

  return (
    a.status === b.status &&
    a.iteration?.current === b.iteration?.current &&
    a.iteration?.total === b.iteration?.total &&
    a.input === b.input &&
    a.output === b.output &&
    a.error === b.error
  )
}

function isSameEdgeRuntimeState(
  a: EdgeRuntimeState,
  b: EdgeRuntimeState
): boolean {
  return a.traversed === b.traversed && a.active === b.active
}

/**
 * Provides the runtime observation overlay to nodes and edges via a
 * subscription store rather than a plain context value, so a status change for
 * a single node re-renders only that node — not every node on the canvas.
 *
 * The overlay is intentionally a prop that flows through this provider and
 * never through the workflow store: routing it through the store would push it
 * onto the history slices, letting a user's undo rewind a running workflow's
 * display.
 */
export function RuntimeObservationProvider({
  mode = "edit",
  overlay,
  children,
}: {
  mode?: WorkflowCanvasMode
  overlay?: WorkflowRuntimeOverlay
  children: ReactNode
}) {
  const overlayRef = useRef<WorkflowRuntimeOverlay | undefined>(overlay)
  const listenersRef = useRef<Set<() => void>>(new Set())

  // Keep the latest overlay in a ref and notify subscribers on change. Reading
  // through the ref (not through the context value) is what lets each consumer
  // pull only its own slice.
  useEffect(() => {
    overlayRef.current = overlay
    for (const listener of listenersRef.current) {
      listener()
    }
  }, [overlay])

  // The reads and subscription close over stable refs, so the store object is
  // recreated only when `mode` changes (rare) — never on an overlay update.
  const store = useMemo<RuntimeObservationStore>(
    () => ({
      mode,
      getNodeState: (nodeId) => overlayRef.current?.nodes[nodeId],
      getEdgeState: (edgeId) => {
        const current = overlayRef.current
        if (!current) {
          return NEUTRAL_EDGE_STATE
        }

        const traversed = current.traversedEdgeIds.includes(edgeId)
        const active = current.activeEdgeIds.includes(edgeId)
        if (!traversed && !active) {
          return NEUTRAL_EDGE_STATE
        }

        return { traversed, active }
      },
      subscribe: (listener) => {
        listenersRef.current.add(listener)
        return () => {
          listenersRef.current.delete(listener)
        }
      },
    }),
    [mode]
  )

  return (
    <RuntimeObservationContext.Provider value={store}>
      {children}
    </RuntimeObservationContext.Provider>
  )
}

/**
 * The current canvas mode. Defaults to `"edit"` when no observation provider is
 * mounted, so existing editor usage is unaffected.
 */
export function useRuntimeMode(): WorkflowCanvasMode {
  return useContext(RuntimeObservationContext)?.mode ?? "edit"
}

/**
 * The runtime state for a single node, or `undefined` when the node is absent
 * from the overlay (its neutral authoring appearance). Re-renders only when
 * this node's own slice changes value.
 */
export function useNodeRuntimeState(
  nodeId: string
): NodeRuntimeState | undefined {
  const store = useContext(RuntimeObservationContext)
  const cacheRef = useRef<NodeRuntimeState | undefined>(undefined)

  const getSnapshot = useCallback(() => {
    const next = store?.getNodeState(nodeId)
    if (isSameNodeRuntimeState(cacheRef.current, next)) {
      return cacheRef.current
    }

    cacheRef.current = next
    return next
  }, [store, nodeId])

  return useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    getSnapshot,
    getSnapshot
  )
}

/**
 * The traversal state for a single edge. An edge inside a loop can be both
 * traversed and active at once, so this returns two independent booleans.
 */
export function useEdgeRuntimeState(edgeId: string): EdgeRuntimeState {
  const store = useContext(RuntimeObservationContext)
  const cacheRef = useRef<EdgeRuntimeState>(NEUTRAL_EDGE_STATE)

  const getSnapshot = useCallback(() => {
    const next = store?.getEdgeState(edgeId) ?? NEUTRAL_EDGE_STATE
    if (isSameEdgeRuntimeState(cacheRef.current, next)) {
      return cacheRef.current
    }

    cacheRef.current = next
    return next
  }, [store, edgeId])

  return useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    getSnapshot,
    getSnapshot
  )
}
