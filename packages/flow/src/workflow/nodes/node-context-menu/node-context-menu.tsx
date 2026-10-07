"use client"

import type { NodeProps } from "@xyflow/react"
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@flow/ui/components/context-menu"
import type { ComponentType } from "react"

import { SelectionCommandMenuItems } from "../../components/selection-command-menu"
import { useWorkflowStore } from "../../store"
import { useRuntimeMode } from "../../runtime"

interface NodeContextMenuProps extends NodeProps {
  children: ComponentType<NodeProps>
}

export function NodeContextMenu({
  children: NodeComponent,
  ...props
}: NodeContextMenuProps) {
  const mode = useRuntimeMode()
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode)

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
      menu={
        <ContextMenu className="w-auto min-w-40">
          <SelectionCommandMenuItems />
        </ContextMenu>
      }
    >
      <NodeComponent {...props} />
    </ContextMenuTrigger>
  )
}
