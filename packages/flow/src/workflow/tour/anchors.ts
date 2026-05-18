import { useCallback } from "react"

import type { NodeKind } from "../node-registry"
import type {
  WorkflowEditorAnchor,
  WorkflowEditorAnchorElementMap,
  WorkflowEditorAnchorRefs,
} from "./types"

export function setWorkflowEditorAnchorElement<K extends WorkflowEditorAnchor>(
  anchorRefs: WorkflowEditorAnchorRefs | undefined,
  anchor: K,
  element: WorkflowEditorAnchorElementMap[K] | null
): void {
  if (!anchorRefs) {
    return
  }

  if (element) {
    anchorRefs.current[anchor] = element
    return
  }

  delete anchorRefs.current[anchor]
}

export function setWorkflowPaletteItemAnchorElement(
  anchorRefs: WorkflowEditorAnchorRefs | undefined,
  kind: NodeKind,
  element: HTMLElement | null
): void {
  if (!anchorRefs) {
    return
  }

  if (element) {
    anchorRefs.current.paletteItems ??= {}
    anchorRefs.current.paletteItems[kind] = element
    return
  }

  delete anchorRefs.current.paletteItems?.[kind]
}

export function useWorkflowEditorAnchorRef<K extends WorkflowEditorAnchor>(
  anchorRefs: WorkflowEditorAnchorRefs | undefined,
  anchor: K
) {
  return useCallback(
    (element: WorkflowEditorAnchorElementMap[K] | null) => {
      setWorkflowEditorAnchorElement(anchorRefs, anchor, element)
    },
    [anchor, anchorRefs]
  )
}

export function useWorkflowPaletteItemAnchorRef(
  anchorRefs: WorkflowEditorAnchorRefs | undefined,
  kind: NodeKind
) {
  return useCallback(
    (element: HTMLElement | null) => {
      setWorkflowPaletteItemAnchorElement(anchorRefs, kind, element)
    },
    [anchorRefs, kind]
  )
}
