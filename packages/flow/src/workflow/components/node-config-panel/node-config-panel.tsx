"use client"

import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from "react"

import { Input } from "@workspace/ui/components/input"

import { getNodeDefinition, type NodeKind } from "../../node-registry/registry"
import type { NodeConfigUpdate } from "../../store/types"
import type {
  ExpressionVariableOption,
  NodeFieldSchema,
  WorkflowNode,
} from "../../types"
import { resolveFieldRenderer, type FieldRendererProps } from "./field-renderers"

type FieldValue = string | number | boolean

interface NodeConfigPanelProps {
  selectedNode: WorkflowNode | null
  expressionVariables: ExpressionVariableOption[]
  onUpdateLabel: (nodeId: string, nextLabel: string) => void
  onUpdateConfigField: (nodeId: string, update: NodeConfigUpdate) => void
}

function asFieldValue(
  value: unknown,
  fallback: FieldValue,
  fieldType: NodeFieldSchema["type"]
): FieldValue {
  if (fieldType === "boolean") {
    return typeof value === "boolean" ? value : fallback
  }

  if (fieldType === "number") {
    return typeof value === "number" ? value : fallback
  }

  return typeof value === "string" ? value : fallback
}

function ConfigField({
  field,
  selectedNode,
  expressionVariables,
  onUpdateConfigField,
}: {
  field: NodeFieldSchema
  selectedNode: WorkflowNode
  expressionVariables: ExpressionVariableOption[]
  onUpdateConfigField: NodeConfigPanelProps["onUpdateConfigField"]
}) {
  const fieldId = useId()
  const descriptionId = field.description ? `${fieldId}-desc` : undefined
  const rawValue = selectedNode.data.config[field.key as keyof typeof selectedNode.data.config]
  const value = asFieldValue(rawValue, "", field.type)
  const Renderer = resolveFieldRenderer(field)
  const props: FieldRendererProps = {
    field,
    value,
    nodeId: selectedNode.id,
    nodeKind: selectedNode.data.kind,
    expressionVariables,
    onUpdateConfigField,
    fieldId,
  }

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="text-[11px] font-medium text-muted-foreground">
        {field.label}
      </label>
      <Renderer {...props} />
      {field.description ? (
        <p id={descriptionId} className="text-[11px] text-muted-foreground">
          {field.description}
        </p>
      ) : null}
    </div>
  )
}

export function NodeConfigPanel({
  selectedNode,
  expressionVariables,
  onUpdateLabel,
  onUpdateConfigField,
}: NodeConfigPanelProps) {
  const labelId = useId()
  const [labelDraft, setLabelDraft] = useState("")
  const [isLabelFocused, setIsLabelFocused] = useState(false)
  const labelDraftRef = useRef(labelDraft)

  useEffect(() => {
    const nextLabel = selectedNode?.data.label ?? ""
    setLabelDraft(nextLabel)
    labelDraftRef.current = nextLabel
    setIsLabelFocused(false)
  }, [selectedNode?.id, selectedNode?.data.label])

  if (!selectedNode) {
    return (
      <aside aria-label="Node configuration" className="w-80 border-l bg-background p-3">
        <h2 className="text-sm font-semibold">Node Config</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Select a node to edit its settings.
        </p>
      </aside>
    )
  }

  const { kind } = selectedNode.data
  const definition = getNodeDefinition(kind as NodeKind)
  const displayedLabel = isLabelFocused ? labelDraft : selectedNode.data.label

  return (
    <aside aria-label="Node configuration" className="w-80 space-y-3 border-l bg-background p-3">
      <h2 className="text-sm font-semibold">Node Config</h2>
      <div className="space-y-1">
        <label htmlFor={labelId} className="text-[11px] font-medium text-muted-foreground">
          Label
        </label>
        <Input
          id={labelId}
          value={displayedLabel}
          onFocus={() => {
            setLabelDraft(selectedNode.data.label)
            labelDraftRef.current = selectedNode.data.label
            setIsLabelFocused(true)
          }}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setLabelDraft(event.target.value)
            labelDraftRef.current = event.target.value
          }}
          onBlur={() => {
            onUpdateLabel(selectedNode.id, labelDraftRef.current)
            setIsLabelFocused(false)
          }}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== "Enter") return
            event.preventDefault()
            onUpdateLabel(selectedNode.id, labelDraftRef.current)
            setIsLabelFocused(false)
            event.currentTarget.blur()
          }}
        />
      </div>

      {definition.fields.map((field: NodeFieldSchema) => (
        <ConfigField
          key={field.key}
          field={field}
          selectedNode={selectedNode}
          expressionVariables={expressionVariables}
          onUpdateConfigField={onUpdateConfigField}
        />
      ))}
    </aside>
  )
}
