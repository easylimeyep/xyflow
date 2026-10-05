"use client"

import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@flow/ui/components/context-menu"
import { Fragment } from "react"

import {
  getAvailableCommands,
  getCommandPresentation,
  startsDestructiveGroup,
  useSelectionCommandActions,
  useSelectionSummary,
} from "../../selection-commands"

/**
 * The context-menu entries for the current selection. Rendered inside an open
 * menu only, so the selection summary is subscribed to while a menu is up —
 * never once per node on the canvas.
 */
export function SelectionCommandMenuItems() {
  const selection = useSelectionSummary()
  const actions = useSelectionCommandActions()
  const commands = getAvailableCommands(selection)

  return commands.map((command, index) => {
    const { label, icon: Icon } = getCommandPresentation(command, selection)

    return (
      <Fragment key={command.id}>
        {startsDestructiveGroup(commands, index) ? (
          <ContextMenuSeparator />
        ) : null}
        <ContextMenuItem
          textValue={label}
          variant={command.destructive ? "destructive" : "default"}
          onAction={() => command.run(actions, selection)}
        >
          <Icon />
          {label}
          {command.shortcut ? (
            <ContextMenuShortcut>{command.shortcut}</ContextMenuShortcut>
          ) : null}
        </ContextMenuItem>
      </Fragment>
    )
  })
}
