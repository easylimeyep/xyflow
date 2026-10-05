"use client"

import { memo } from "react"

import { workflowMiniMapStyles } from "../../../styles/components/canvas"

interface MiniMapNodeLayerProps {
  framesD: string
  nodesD: string
}

const styles = workflowMiniMapStyles()

/**
 * Every node as one path, with group frames beneath them. Memoized on the
 * path strings, so panning, which only moves the viewport, never redraws it.
 */
export const MiniMapNodeLayer = memo(function MiniMapNodeLayer({
  framesD,
  nodesD,
}: MiniMapNodeLayerProps) {
  return (
    <>
      {framesD ? (
        <path
          className={styles.frames()}
          d={framesD}
          data-testid="workflow-minimap-frames"
        />
      ) : null}
      {nodesD ? (
        <path
          className={styles.nodes()}
          d={nodesD}
          data-testid="workflow-minimap-nodes"
        />
      ) : null}
    </>
  )
})
