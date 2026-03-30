"use client"

import { useEffect, useRef } from "react"

import {
  ActionBar,
  ActionBarSelection,
  ActionBarSeparator,
} from "@workspace/ui/components/action-bar"
import { Badge } from "@workspace/ui/components/badge"
import { WORKFLOW_NODE_KIND_MIME } from "../../dnd"
import {
  nodeRegistry,
  WORKFLOW_NODE_KINDS,
  type NodeKind,
} from "../../node-registry/registry"
import { nodePaletteStyles } from "../../../styles/components/panels"

interface NodePaletteProps {
  onAddNode: (kind: NodeKind) => void
  quickAddActive?: boolean
}

const entries = WORKFLOW_NODE_KINDS.map((kind) => nodeRegistry[kind])

export function NodePalette({
  onAddNode,
  quickAddActive = false,
}: NodePaletteProps) {
  const containerRef = useRef<HTMLElement | null>(null)
  const styles = nodePaletteStyles({ quickAddActive })

  useEffect(() => {
    if (!quickAddActive) {
      return
    }

    containerRef.current?.focus()
  }, [quickAddActive])

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
        ref={containerRef}
        tabIndex={-1}
        aria-label="Node palette"
        className={styles.aside()}
      >
        <h2 className={styles.heading()}>Node Palette</h2>
        <div className={styles.list()}>
          {entries.map((definition) => {
            const Icon = definition.icon

            return (
              <div
                key={definition.kind}
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
