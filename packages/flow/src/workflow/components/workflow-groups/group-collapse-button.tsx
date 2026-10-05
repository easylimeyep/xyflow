"use client"

import { Button } from "@flow/ui/components/button"
import { ChevronDown, ChevronRight } from "lucide-react"

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

  return (
    <ActionTooltip label={label}>
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label={label}
        aria-expanded={!collapsed}
        onPress={() => setCollapsed(groupId, !collapsed)}
      >
        <Icon />
      </Button>
    </ActionTooltip>
  )
}
