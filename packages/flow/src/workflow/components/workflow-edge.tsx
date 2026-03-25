"use client"

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react"
import { Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import type { WorkflowEdge } from "../types"

interface WorkflowEdgeProps extends EdgeProps<WorkflowEdge> {
  onStartInsert: (edgeId: string) => void
  onDeleteEdge: (edgeId: string) => void
  isInsertPending: boolean
}

export function WorkflowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
  style,
  onStartInsert,
  onDeleteEdge,
  isInsertPending,
}: WorkflowEdgeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isToolbarHovered, setIsToolbarHovered] = useState(false)
  const [edgePath, labelX, labelY] = useMemo(
    () =>
      getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      }),
    [sourcePosition, sourceX, sourceY, targetPosition, targetX, targetY]
  )
  const showToolbar = isHovered || isToolbarHovered || isInsertPending

  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`workflow-edge-${id}`}
      >
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            strokeWidth: selected || isInsertPending ? 2.5 : 1.5,
          }}
        />
        <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />
      </g>

      <EdgeLabelRenderer>
        <div
          className={`absolute z-20 transition-opacity ${showToolbar ? "opacity-100" : "opacity-0"}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: showToolbar ? "all" : "none",
          }}
        >
          <div
            className="nodrag nopan inline-flex items-center gap-1 rounded-md border bg-background/95 p-1 shadow-sm"
            onMouseEnter={() => setIsToolbarHovered(true)}
            onMouseLeave={() => setIsToolbarHovered(false)}
          >
            <button
              type="button"
              className="inline-flex size-6 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Insert node on edge ${id}`}
              data-testid={`edge-insert-${id}`}
              onClick={(event) => {
                event.stopPropagation()
                onStartInsert(id)
              }}
              onMouseDown={(event) => {
                event.stopPropagation()
              }}
            >
              <Plus className="size-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex size-6 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete edge ${id}`}
              data-testid={`edge-delete-${id}`}
              onClick={(event) => {
                event.stopPropagation()
                onDeleteEdge(id)
              }}
              onMouseDown={(event) => {
                event.stopPropagation()
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
