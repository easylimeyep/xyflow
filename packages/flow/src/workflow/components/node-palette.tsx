"use client"

import {
  Braces,
  Code2,
  FileInput,
  GitBranch,
  Play,
  WandSparkles,
  type LucideIcon,
} from "lucide-react"

import type { NodeKind } from "../types"
import { WORKFLOW_NODE_KIND_MIME } from "../dnd"
import { workflowNodeRegistry } from "../node-registry"

interface NodePaletteProps {
  onAddNode: (kind: NodeKind) => void
}

const iconByNodeKind: Record<NodeKind, LucideIcon> = {
  trigger: Play,
  branch: GitBranch,
  transform: WandSparkles,
  code: Code2,
  customInput: FileInput,
  inlineExpression: Braces,
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const entries: Array<(typeof workflowNodeRegistry)[NodeKind]> = [
    workflowNodeRegistry.trigger,
    workflowNodeRegistry.branch,
    workflowNodeRegistry.transform,
    workflowNodeRegistry.code,
    workflowNodeRegistry.customInput,
    workflowNodeRegistry.inlineExpression,
  ]

  return (
    <aside className="w-72 space-y-2 border-r bg-background p-3">
      <h2 className="text-sm font-semibold">Node Palette</h2>
      {entries.map((definition) => {
        const Icon = iconByNodeKind[definition.kind]

        return (
          <div
            key={definition.kind}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move"
              event.dataTransfer.setData(WORKFLOW_NODE_KIND_MIME, definition.kind)
            }}
          >
            <button
              type="button"
              className="w-full rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted"
              onClick={() => onAddNode(definition.kind)}
            >
              <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                <Icon className="size-3.5 text-muted-foreground" />
                <span>{definition.title}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {definition.description}
              </div>
            </button>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Drag to canvas or click to add
            </p>
          </div>
        )
      })}
    </aside>
  )
}
