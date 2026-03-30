"use client"

import { type ChangeEvent, type KeyboardEvent, useId, useState } from "react"

import { Input } from "@workspace/ui/components/input"
import { nodeConfigPanelStyles } from "../../../styles/components/panels"

import { getNodeDefinition, type NodeKind } from "../../node-registry/registry"
import type { NodeConfigUpdate } from "../../store/types"
import type {
  ExpressionVariableOption,
  NodeFieldSchema,
  WorkflowNode,
} from "../../types"
import { FieldRenderer, type FieldRendererProps } from "./field-renderers"

type FieldValue = string | number | boolean
const styles = nodeConfigPanelStyles()

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
    <div className={styles.fieldGroup()}>
      <label htmlFor={fieldId} className={styles.label()}>
        {field.label}
      </label>
      <FieldRenderer {...props} />
      {field.description ? (
        <p id={descriptionId} className={styles.description()}>
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

  if (!selectedNode) {
    return (
      <aside aria-label="Node configuration" className={styles.aside()}>
        <h2 className={styles.heading()}>Node Config</h2>
        <p className={styles.emptyMessage()}>
          Select a node to edit its settings.
        </p>
      </aside>
    )
  }

  const { kind } = selectedNode.data
  const definition = getNodeDefinition(kind as NodeKind)
  const displayedLabel = isLabelFocused ? labelDraft : selectedNode.data.label

  return (
    <aside aria-label="Node configuration" className={styles.asideWithContent()}>
      <h2 className={styles.heading()}>Node Config</h2>
      <div className={styles.fieldGroup()}>
        <label htmlFor={labelId} className={styles.label()}>
          Label
        </label>
        <Input
          id={labelId}
          value={displayedLabel}
          onFocus={() => {
            setLabelDraft(selectedNode.data.label)
            setIsLabelFocused(true)
          }}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setLabelDraft(event.target.value)
          }}
          onBlur={() => {
            onUpdateLabel(selectedNode.id, labelDraft)
            setIsLabelFocused(false)
          }}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== "Enter") return
            event.preventDefault()
            onUpdateLabel(selectedNode.id, labelDraft)
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
