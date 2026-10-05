"use client"

import {
  ContextMenu,
  ContextMenuTrigger,
} from "@flow/ui/components/context-menu"
import type { ReactNode } from "react"

import { SelectionCommandMenuItems } from "../selection-command-menu"
import { useSelectGroupOnly } from "./use-select-group"

interface GroupContextMenuProps {
  groupId: string
  selected: boolean
  /** Without editing there is nothing to offer, so no menu at all. */
  enabled: boolean
  children: ReactNode
}

/**
 * The right-click menu of a group header or card: the same commands as the
 * group toolbar. Opening it on an unselected group selects that group first,
 * so the commands act on what the user pointed at.
 */
export function GroupContextMenu({
  groupId,
  selected,
  enabled,
  children,
}: GroupContextMenuProps) {
  const selectGroupOnly = useSelectGroupOnly()

  if (!enabled) {
    return children
  }

  return (
    <ContextMenuTrigger
      className="contents"
      onOpenChange={(open) => {
        if (open && !selected) {
          selectGroupOnly(groupId)
        }
      }}
    >
      {children}
      <ContextMenu className="w-auto min-w-40">
        <SelectionCommandMenuItems />
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
