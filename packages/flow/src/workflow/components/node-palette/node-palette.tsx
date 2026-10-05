"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"

import {
  ActionBar,
  ActionBarSelection,
  ActionBarSeparator,
} from "@flow/ui/components/action-bar"
import { Badge } from "@flow/ui/components/badge"
import { WORKFLOW_NODE_KIND_MIME } from "../../dnd"
import type { NodeDefinition } from "../../node-registry/define-node"
import type { NodeKind } from "../../node-registry/registry"
import { useNodeDefinitions } from "../../node-registry/use-node-definitions"
import { nodePaletteStyles } from "../../../styles/components/panels"
import type { WorkflowEditorAnchorRefs } from "../../tour"
import {
  setWorkflowEditorAnchorElement,
  setWorkflowPaletteItemAnchorElement,
} from "../../tour/anchors"

interface NodePaletteProps {
  onAddNode: (kind: NodeKind) => void
  quickAddActive?: boolean
  isOpen?: boolean
  anchorRefs?: WorkflowEditorAnchorRefs
  /** Extra classes for the palette's aside element, merged into the package's own. */
  className?: string
  /**
   * Where the palette sits. `floating` pins it over the canvas at the right,
   * which is the package's historical layout. `inline` renders it in flow, so
   * the host can give it a lane in its own grid or flex row.
   */
  placement?: "floating" | "inline"
}

export function NodePalette({
  onAddNode,
  quickAddActive = false,
  isOpen = true,
  anchorRefs,
  className,
  placement = "floating",
}: NodePaletteProps) {
  const entries = useNodeDefinitions()
  const containerRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(isOpen)
  // Where focus was before the palette took it, so hiding hands it back
  // instead of stranding it in a hidden aside — the floating search's rule.
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const styles = nodePaletteStyles({ quickAddActive, placement })
  // The kind being dragged, shown by the drag preview. Without a drag image of
  // our own the browser snapshots the card through the scrolling list's layer,
  // and the list's overlay scrollbar ends up in the ghost.
  const [draggedDefinition, setDraggedDefinition] =
    useState<NodeDefinition | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const PreviewIcon = draggedDefinition?.icon

  // A layout effect: a host hiding the closed palette with `display: none`
  // would otherwise have the browser drop focus to the body before we look.
  useLayoutEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen
    const container = containerRef.current

    if (!isOpen) {
      if (wasOpen && container?.contains(document.activeElement)) {
        const returnFocus = returnFocusRef.current?.isConnected
          ? returnFocusRef.current
          : container.closest<HTMLElement>("[data-workflow-editor-root]")
        returnFocus?.focus()
      }
      returnFocusRef.current = null
      return
    }

    if (wasOpen && !quickAddActive) {
      return
    }

    const active = document.activeElement
    if (active instanceof HTMLElement && !container?.contains(active)) {
      returnFocusRef.current = active
    }
    container?.focus()
  }, [isOpen, quickAddActive])

  return (
    <>
      <ActionBar
        open={quickAddActive}
        side="top"
        align="center"
        sideOffset={16}
      >
        <ActionBarSelection className="border-primary/40 bg-primary/10 text-lg text-primary">
          <Badge variant="default" className="py-3 text-lg">
            Quick add
          </Badge>
          <ActionBarSeparator />
          <span className="text-lg">
            Select a node kind to complete insertion.
          </span>
        </ActionBarSelection>
      </ActionBar>
      <aside
        ref={(element) => {
          containerRef.current = element
          setWorkflowEditorAnchorElement(anchorRefs, "palette", element)
        }}
        tabIndex={-1}
        aria-label="Node palette"
        aria-hidden={!isOpen}
        data-state={isOpen ? "open" : "closed"}
        className={styles.aside({ class: className })}
      >
        <h2 className={styles.heading()}>Node Palette</h2>
        <div className={styles.list()}>
          {entries.map((definition) => {
            const Icon = definition.icon

            return (
              <div
                key={definition.kind}
                ref={(element) =>
                  setWorkflowPaletteItemAnchorElement(
                    anchorRefs,
                    definition.kind,
                    element
                  )
                }
                // A pending insertion already chose where the node goes; the
                // palette is only its kind picker, so cards are click-only.
                draggable={!quickAddActive}
                className={styles.card()}
                onDragStart={(event) => {
                  if (quickAddActive) {
                    event.preventDefault()
                    return
                  }
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData(
                    WORKFLOW_NODE_KIND_MIME,
                    definition.kind
                  )
                  // The browser snapshots the drag image before this handler
                  // returns, so the preview must hold this kind already.
                  flushSync(() => setDraggedDefinition(definition))
                  // (0, 0): the pointer holds the preview's top-left corner,
                  // the point a canvas drop places the new node at.
                  if (previewRef.current) {
                    event.dataTransfer.setDragImage?.(previewRef.current, 0, 0)
                  }
                }}
                onDragEnd={() => setDraggedDefinition(null)}
              >
                <button
                  type="button"
                  aria-label={`Add ${definition.title} node`}
                  className={styles.cardButton()}
                  onClick={() => onAddNode(definition.kind as NodeKind)}
                >
                  <div className={styles.iconWrap()}>
                    <Icon className={styles.icon()} />
                  </div>
                  <div className={styles.textWrap()}>
                    <span className={styles.title()}>{definition.title}</span>
                    <span className={styles.description()}>
                      {definition.description}
                    </span>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </aside>
      <div
        ref={previewRef}
        aria-hidden
        data-palette-drag-preview=""
        className={styles.preview()}
      >
        {PreviewIcon ? (
          <>
            <PreviewIcon className={styles.previewIcon()} />
            <span className={styles.previewTitle()}>
              {draggedDefinition?.title}
            </span>
          </>
        ) : null}
      </div>
    </>
  )
}
