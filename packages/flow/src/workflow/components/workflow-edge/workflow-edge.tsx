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
import { useEdgeRuntimeState, useRuntimeMode } from "../../runtime"
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
  const runtime = useEdgeRuntimeState(id)
  const interactive = useRuntimeMode() === "edit"
  const hasTraversal = runtime.traversed || runtime.active
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  const showToolbar =
    interactive && (isHovered || isToolbarHovered || isInsertPending)
  const styles = showToolbar ? toolbarVisibleStyles : toolbarHiddenStyles
  const highlightEdge =
    selected || isHovered || isToolbarHovered || isInsertPending
  const baseStroke = highlightEdge ? edgeStrokeHighlighted : edgeStrokeDefault
  // Traversal stroke is applied through a className so the tv variant can win;
  // an inline stroke would override it. Runtime edges therefore skip inline
  // stroke and let `edgePathClassName` drive their colour and width.
  const edgePathClassName = hasTraversal
    ? workflowEdgeStyles({
        traversed: runtime.traversed,
        active: runtime.active,
      }).edgePath()
    : undefined
  const edgeStyle = hasTraversal
    ? style
    : style
      ? { ...style, ...baseStroke }
      : baseStroke

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
          className={edgePathClassName}
        />
        <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />
      </g>

      {interactive ? (
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
                className={styles.actionButton({
                  class: styles.insertButton(),
                })}
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
                className={styles.actionButton({
                  class: styles.deleteButton(),
                })}
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
      ) : null}
    </>
  )
}
