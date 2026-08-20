"use client"

import type { NodeProps } from "@xyflow/react"
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu"
import { Copy, CopyPlus, Trash2 } from "lucide-react"
import type { ComponentType } from "react"

import { useWorkflowShallowStore, type WorkflowStoreState } from "../../store"

interface NodeContextMenuProps extends NodeProps {
  children: ComponentType<NodeProps>
}

export function NodeContextMenu({
  children: NodeComponent,
  ...props
}: NodeContextMenuProps) {
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
          <ContextMenuShortcut>Backspace</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
