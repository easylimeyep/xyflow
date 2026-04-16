"use client"

import { useMemo } from "react"

import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { nodeRegistry } from "../../node-registry/registry"
import { useWorkflowSelection, useWorkflowShallowStore } from "../../store"
import type { WorkflowStoreState } from "../../store"

export function WorkflowEditorConfigPanel() {
  const { selectedNodeIds, selectedNode } = useWorkflowSelection()
  const updateNodeLabel = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeLabel
  )

  const selectedDefinition = selectedNode
    ? nodeRegistry[selectedNode.data.kind as keyof typeof nodeRegistry]
    : null

  const configPreview = useMemo(() => {
    if (!selectedNode) {
      return ""
    }

    return JSON.stringify(selectedNode.data.config, null, 2)
  }, [selectedNode])

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-3 border-l bg-background p-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Config Panel</h2>
        <p className="text-xs text-muted-foreground">
          Inspect the current selection and adjust the selected node label.
        </p>
      </div>

      {selectedNode ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Node type
            </span>
            <p className="text-sm font-medium">
              {selectedDefinition?.title ?? selectedNode.data.kind}
            </p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor={`workflow-editor-selected-label-${selectedNode.id}`}
              className="text-xs font-medium text-muted-foreground"
            >
              Label
            </label>
            <Input
              id={`workflow-editor-selected-label-${selectedNode.id}`}
              value={selectedNode.data.label}
              onChange={(event) =>
                updateNodeLabel(selectedNode.id, event.target.value)
              }
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Node id
            </span>
            <p className="break-all rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs">
              {selectedNode.id}
            </p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor={`workflow-editor-selected-config-${selectedNode.id}`}
              className="text-xs font-medium text-muted-foreground"
            >
              Config preview
            </label>
            <Textarea
              id={`workflow-editor-selected-config-${selectedNode.id}`}
              value={configPreview}
              readOnly
              rows={12}
              className="font-mono text-xs"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          {selectedNodeIds.length > 1
            ? "Multiple nodes are selected. Pick a single node to inspect its details."
            : "Select a node on the canvas to inspect it here."}
        </div>
      )}
    </aside>
  )
}
