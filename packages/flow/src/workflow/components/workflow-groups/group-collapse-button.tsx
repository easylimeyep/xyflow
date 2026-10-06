"use client"

import { Button } from "@flow/ui/components/button"
import { ChevronDown, ChevronRight } from "lucide-react"

import { groupToolbarStyles } from "../../../styles/components/canvas"
import { ActionTooltip } from "../action-tooltip"
import { useGroupCanvas } from "./group-canvas-context"

interface GroupCollapseButtonProps {
  groupId: string
  collapsed: boolean
}

/** The chevron that collapses or expands a group, in either canvas mode. */
export function GroupCollapseButton({
  groupId,
  collapsed,
}: GroupCollapseButtonProps) {
  const { setCollapsed } = useGroupCanvas()
  const label = collapsed ? "Expand group" : "Collapse group"
  const Icon = collapsed ? ChevronRight : ChevronDown
  const styles = groupToolbarStyles()

  return (
    <ActionTooltip label={label}>
      <Button
        size="icon"
        variant="ghost"
        className={styles.button()}
        aria-label={label}
        aria-expanded={!collapsed}
        onPress={() => setCollapsed(groupId, !collapsed)}
      >
        <Icon className={styles.icon()} />
      </Button>
    </ActionTooltip>
  )
}
