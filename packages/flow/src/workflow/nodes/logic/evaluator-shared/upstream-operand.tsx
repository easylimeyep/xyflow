"use client"

import { Tooltip, TooltipTrigger } from "@flow/ui/components/tooltip"
import { CornerDownRight } from "lucide-react"

import { evaluatorNodeStyles } from "../../../../styles/components/nodes"

const styles = evaluatorNodeStyles()

export const UPSTREAM_OPERAND_FALLBACK_TEXT = "Previous node output"

interface UpstreamOperandProps {
  /** Label of the single node feeding this one, when there is exactly one. */
  upstreamNodeLabel?: string | null
}

/**
 * Stands in for the left operand of a condition the backend fills from the
 * previous node's output. It is deliberately not editable: naming the source
 * node tells the user more than an input they cannot change.
 */
export function UpstreamOperand({ upstreamNodeLabel }: UpstreamOperandProps) {
  const label = upstreamNodeLabel?.trim()
  const text = label ? `Output of "${label}"` : UPSTREAM_OPERAND_FALLBACK_TEXT

  return (
    <TooltipTrigger>
      <div className={styles.upstreamOperand()} aria-label="Left operand">
        <CornerDownRight className={styles.upstreamOperandIcon()} />
        <span className={styles.upstreamOperandText()}>{text}</span>
      </div>
      <Tooltip>
        This operand is filled with the previous node&apos;s output.
      </Tooltip>
    </TooltipTrigger>
  )
}
