"use client"

import type { NodeProps } from "@xyflow/react"
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@flow/ui/components/context-menu"
import { Fragment, type ComponentType } from "react"

import { useWorkflowStore } from "../../store"
import { useRuntimeMode } from "../../runtime"
import {
  SELECTION_COMMANDS,
  startsDestructiveGroup,
  useSelectionCommandActions,
} from "../../selection-commands"

interface NodeContextMenuProps extends NodeProps {
  children: ComponentType<NodeProps>
}

export function NodeContextMenu({
  children: NodeComponent,
  ...props
}: NodeContextMenuProps) {
  const mode = useRuntimeMode()
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode)
  const commandActions = useSelectionCommandActions()

  // In observe mode every menu entry mutates the graph, so the whole menu is
  // withheld — the node still renders and stays selectable for the inspector.
  if (mode === "observe") {
    return <NodeComponent {...props} />
  }

  const ensureNodeContextTarget = () => {
    if (props.selected) {
      return
    }

    setSelectedNode(props.id)
  }

  return (
    <ContextMenuTrigger
      className="contents"
      onOpenChange={(open) => {
        if (open) {
          ensureNodeContextTarget()
        }
      }}
    >
      <NodeComponent {...props} />
      <ContextMenu className="w-auto min-w-40">
        {SELECTION_COMMANDS.map((command, index) => {
          const Icon = command.icon

          return (
            <Fragment key={command.id}>
              {startsDestructiveGroup(SELECTION_COMMANDS, index) ? (
                <ContextMenuSeparator />
              ) : null}
              <ContextMenuItem
                variant={command.destructive ? "destructive" : "default"}
                onAction={() => command.run(commandActions)}
              >
                <Icon />
                {command.label}
                <ContextMenuShortcut>{command.shortcut}</ContextMenuShortcut>
              </ContextMenuItem>
            </Fragment>
          )
        })}
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
