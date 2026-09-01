"use client"

import { useEffect, useRef } from "react"

import {
  ActionBar,
  ActionBarSelection,
  ActionBarSeparator,
} from "@flow/ui/components/action-bar"
import { Badge } from "@flow/ui/components/badge"
import { WORKFLOW_NODE_KIND_MIME } from "../../dnd"
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
  const styles = nodePaletteStyles({ quickAddActive, placement })

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (wasOpenRef.current === isOpen && !quickAddActive) {
      return
    }

    containerRef.current?.focus()
  }, [isOpen, quickAddActive])

  useEffect(() => {
    wasOpenRef.current = isOpen
  }, [isOpen])

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
                draggable
                className={styles.card()}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData(
                    WORKFLOW_NODE_KIND_MIME,
                    definition.kind
                  )
                }}
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
    </>
  )
}
