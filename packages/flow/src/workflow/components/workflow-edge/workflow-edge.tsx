"use client"

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { workflowEdgeStyles } from "../../../styles/components/canvas"
import type { WorkflowEdge } from "../../types"

interface WorkflowEdgeProps extends EdgeProps<WorkflowEdge> {
  onStartInsert: (edgeId: string) => void
  onDeleteEdge: (edgeId: string) => void
  isInsertPending: boolean
}

const edgeStrokeDefault = {
  stroke: "var(--border)",
  strokeWidth: 2,
}

const edgeStrokeHighlighted = {
  stroke: "var(--primary)",
  strokeWidth: 2.5,
}

const toolbarVisibleStyles = workflowEdgeStyles({ showToolbar: true })
const toolbarHiddenStyles = workflowEdgeStyles({ showToolbar: false })

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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  const showToolbar = isHovered || isToolbarHovered || isInsertPending
  const styles = showToolbar ? toolbarVisibleStyles : toolbarHiddenStyles
  const highlightEdge = selected || isHovered || isToolbarHovered || isInsertPending
  const baseStroke = highlightEdge ? edgeStrokeHighlighted : edgeStrokeDefault
  const edgeStyle = style ? { ...style, ...baseStroke } : baseStroke

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
          style={edgeStyle}
        />
        <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />
      </g>

      <EdgeLabelRenderer>
        <div
          className={styles.toolbarContainer()}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: showToolbar ? "all" : "none",
          }}
        >
          <div
            className={styles.toolbar()}
            onMouseEnter={() => setIsToolbarHovered(true)}
            onMouseLeave={() => setIsToolbarHovered(false)}
          >
            <button
              type="button"
              className={styles.actionButton({ class: styles.insertButton() })}
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
              <Plus className={styles.actionIcon()} />
            </button>
            <button
              type="button"
              className={styles.actionButton({ class: styles.deleteButton() })}
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
              <Trash2 className={styles.actionIcon()} />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
