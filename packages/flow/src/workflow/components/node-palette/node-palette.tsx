"use client"

import { useEffect, useRef } from "react"

import { WORKFLOW_NODE_KIND_MIME } from "../../dnd"
import { nodeRegistry, WORKFLOW_NODE_KINDS, type NodeKind } from "../../node-registry/registry"
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
    <aside
      ref={containerRef}
      tabIndex={-1}
      aria-label="Node palette"
      className={styles.aside()}
    >
      {quickAddActive ? (
        <div className={styles.quickAddHint()}>
          Select a node kind to complete insertion.
        </div>
      ) : null}
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
                  <span className={styles.title()}>
                    {definition.title}
                  </span>
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
  )
}
