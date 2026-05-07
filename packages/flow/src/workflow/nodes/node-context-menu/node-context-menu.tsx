"use client"

import type { NodeProps } from "@xyflow/react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu"
import { Copy, CopyPlus, Trash2 } from "lucide-react"
import type { ComponentType } from "react"

import { useWorkflowShallowStore, type WorkflowStoreState } from "../../store"
import { Kbd } from "@workspace/ui/components/kbd"

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
    <ContextMenu>
      <ContextMenuTrigger
        className="contents"
        onContextMenu={ensureNodeContextTarget}
      >
        <NodeComponent {...props} />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onSelect={() => {
            void copySelectionToClipboard()
          }}
        >
          <Copy />
          Copy
          <Kbd className="ml-auto">Ctrl+C</Kbd>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => duplicateNodes()}>
          <CopyPlus />
          Duplicate
          <Kbd className="ml-auto">Ctrl+D</Kbd>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={() => deleteNodes()}>
          <Trash2 />
          Delete
          <Kbd className="ml-auto">Backspace</Kbd>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
