"use client"

import { useEffect, useRef, useState } from "react"

import { WORKFLOW_NODE_KIND_MIME } from "../../dnd"
import { nodeRegistry, WORKFLOW_NODE_KINDS, type NodeKind } from "../../node-registry/registry"

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
  const [showQuickAddHint, setShowQuickAddHint] = useState(false)

  useEffect(() => {
    if (!quickAddActive) {
      setShowQuickAddHint(false)
      return
    }

    containerRef.current?.focus()
    setShowQuickAddHint(true)
    const timeoutId = window.setTimeout(() => {
      setShowQuickAddHint(false)
    }, 2200)

    return () => window.clearTimeout(timeoutId)
  }, [quickAddActive])

  return (
    <aside
      ref={containerRef}
      tabIndex={-1}
      aria-label="Node palette"
      className={`relative w-72 space-y-2 border-r bg-background p-3 outline-none ${
        quickAddActive ? "ring-2 ring-primary/60 ring-inset" : ""
      }`}
    >
      {showQuickAddHint ? (
        <div className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs text-primary">
          Select a node kind to complete insertion.
        </div>
      ) : null}
      <h2 className="text-sm font-semibold">Node Palette</h2>
      <div className="flex flex-col gap-2">
        {entries.map((definition) => {
          const Icon = definition.icon

          return (
            <div
              key={definition.kind}
              draggable
              className="rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted"
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
                className="align-center flex w-full gap-2"
                onClick={() => onAddNode(definition.kind as NodeKind)}
              >
                <div className="flex items-center justify-center">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start gap-1">
                  <span className="text-lg font-medium">
                    {definition.title}
                  </span>
                  <span className="text-left text-xs text-muted-foreground">
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
