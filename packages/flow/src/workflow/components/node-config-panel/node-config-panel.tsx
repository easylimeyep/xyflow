"use client"

import { type Ref, useMemo } from "react"

import { Input } from "@flow/ui/components/input"
import { Textarea } from "@flow/ui/components/textarea"
import { useNodeDefinitions } from "../../node-registry/use-node-definitions"
import { useWorkflowSelection, useWorkflowShallowStore } from "../../store"
import type { WorkflowStoreState } from "../../store"
import type { WorkflowCanvasMode } from "../../types"
import { NodeInspector } from "./node-inspector"

interface WorkflowEditorConfigPanelProps {
  anchorRef?: Ref<HTMLElement>
  mode?: WorkflowCanvasMode
}

export function WorkflowEditorConfigPanel({
  anchorRef,
  mode = "edit",
}: WorkflowEditorConfigPanelProps) {
  const { selectedNodeIds, selectedNode } = useWorkflowSelection()
  const updateNodeLabel = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeLabel
  )
  const isObserving = mode === "observe"

  // Resolved out of the subscribed list rather than a direct registry read, so
  // the panel is correct when a consumer registers kinds after the editor
  // mounted.
  const definitions = useNodeDefinitions()
  const selectedDefinition = useMemo(
    () =>
      selectedNode
        ? (definitions.find(
            (definition) => definition.kind === selectedNode.data.kind
          ) ?? null)
        : null,
    [selectedNode, definitions]
  )

  const configPreview = useMemo(() => {
    if (!selectedNode) {
      return ""
    }

    return JSON.stringify(selectedNode.data.config, null, 2)
  }, [selectedNode])

  return (
    <aside
      ref={anchorRef}
      aria-label="Workflow config panel"
      className="flex w-80 shrink-0 flex-col gap-3 border-l bg-background p-3"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">
          {isObserving ? "Inspector" : "Config Panel"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isObserving
            ? "Inspect the selected node's runtime input and output."
            : "Inspect the current selection and adjust the selected node label."}
        </p>
      </div>

      {isObserving ? (
        selectedNode ? (
          <NodeInspector
            nodeId={selectedNode.id}
            nodeTitle={selectedDefinition?.title ?? selectedNode.data.kind}
          />
        ) : (
          <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            {selectedNodeIds.length > 1
              ? "Multiple nodes are selected. Pick a single node to inspect its run state."
              : "Select a node on the canvas to inspect its run state."}
          </div>
        )
      ) : selectedNode ? (
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
            <p className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs break-all">
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
