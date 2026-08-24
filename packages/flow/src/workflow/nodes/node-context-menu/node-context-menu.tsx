"use client"

import type { NodeProps } from "@xyflow/react"
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@flow/ui/components/context-menu"
import { Copy, CopyPlus, Trash2 } from "lucide-react"
import type { ComponentType } from "react"

import { useWorkflowShallowStore, type WorkflowStoreState } from "../../store"
import { useRuntimeMode } from "../../runtime"

interface NodeContextMenuProps extends NodeProps {
  children: ComponentType<NodeProps>
}

export function NodeContextMenu({
  children: NodeComponent,
  ...props
}: NodeContextMenuProps) {
  const mode = useRuntimeMode()
  const {
    setSelectedNode,
    copySelectionToClipboard,
    duplicateNodes,
    deleteNodes,
  } = useWorkflowShallowStore((state: WorkflowStoreState) => ({
    setSelectedNode: state.setSelectedNode,
    copySelectionToClipboard: state.copySelectionToClipboard,
    duplicateNodes: state.duplicateNodes,
    deleteNodes: state.deleteNodes,
  }))

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
        <ContextMenuItem
          onAction={() => {
            void copySelectionToClipboard()
          }}
        >
          <Copy />
          Copy
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onAction={() => duplicateNodes()}>
          <CopyPlus />
          Duplicate
          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onAction={() => deleteNodes()}>
          <Trash2 />
          Delete
          <ContextMenuShortcut>Del / Backspace</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
