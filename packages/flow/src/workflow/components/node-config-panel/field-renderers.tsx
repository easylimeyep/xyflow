"use client"

import { useCallback, type ChangeEvent } from "react"

import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { nodeConfigPanelStyles } from "../../../styles/components/panels"

import { ExpressionInput } from "../expression-input"
import type { NodeConfigUpdate } from "../../store/types"
import type { ExpressionVariableOption, FieldOption, NodeFieldSchema } from "../../types"

type FieldValue = string | number | boolean
const styles = nodeConfigPanelStyles()

export interface FieldRendererProps {
  field: NodeFieldSchema
  value: FieldValue
  nodeId: string
  nodeKind: string
  expressionVariables: ExpressionVariableOption[]
  onUpdateConfigField: (nodeId: string, update: NodeConfigUpdate) => void
  fieldId?: string
}

function ExpressionFieldRenderer({
  field,
  value,
  nodeId,
  nodeKind,
  expressionVariables,
  onUpdateConfigField,
}: FieldRendererProps) {
  const handleChange = useCallback(
    (nextValue: string) => {
      onUpdateConfigField(nodeId, {
        kind: nodeKind,
        key: field.key,
        value: nextValue,
      })
    },
    [field.key, nodeId, nodeKind, onUpdateConfigField]
  )

  return (
    <ExpressionInput
      value={String(value)}
      placeholder={field.placeholder}
      variables={expressionVariables}
      onChange={handleChange}
    />
  )
}

function TextFieldRenderer({ field, value, nodeId, nodeKind, onUpdateConfigField, fieldId }: FieldRendererProps) {
  return (
    <Input
      id={fieldId}
      value={String(value)}
      placeholder={field.placeholder}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onUpdateConfigField(nodeId, {
          kind: nodeKind,
          key: field.key,
          value: event.target.value,
        })
      }
    />
  )
}

function TextareaFieldRenderer({ field, value, nodeId, nodeKind, onUpdateConfigField, fieldId }: FieldRendererProps) {
  return (
    <Textarea
      id={fieldId}
      value={String(value)}
      placeholder={field.placeholder}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
        onUpdateConfigField(nodeId, {
          kind: nodeKind,
          key: field.key,
          value: event.target.value,
        })
      }
    />
  )
}

function NumberFieldRenderer({ field, value, nodeId, nodeKind, onUpdateConfigField, fieldId }: FieldRendererProps) {
  return (
    <Input
      id={fieldId}
      type="number"
      value={String(value)}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onUpdateConfigField(nodeId, {
          kind: nodeKind,
          key: field.key,
          value: Number(event.target.value) || 0,
        })
      }
    />
  )
}

function BooleanFieldRenderer({ field, value, nodeId, nodeKind, onUpdateConfigField, fieldId }: FieldRendererProps) {
  return (
    <label htmlFor={fieldId} className={styles.booleanLabel()}>
      <input
        id={fieldId}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onUpdateConfigField(nodeId, {
            kind: nodeKind,
            key: field.key,
            value: event.target.checked,
          })
        }
      />
      Enabled
    </label>
  )
}

function SelectFieldRenderer({ field, value, nodeId, nodeKind, onUpdateConfigField }: FieldRendererProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(nextValue) =>
        onUpdateConfigField(nodeId, {
          kind: nodeKind,
          key: field.key,
          value: nextValue,
        })
      }
    >
      <SelectTrigger className={styles.selectTrigger()}>
        <SelectValue placeholder="Select value" />
      </SelectTrigger>
      <SelectContent>
        {field.options?.map((option: FieldOption) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function FieldRenderer(props: FieldRendererProps) {
  const { field } = props
  const isExpressionField =
    field.ui === "expression" && (field.type === "text" || field.type === "textarea")

  if (isExpressionField) return <ExpressionFieldRenderer {...props} />

  switch (field.type) {
    case "text":
      return <TextFieldRenderer {...props} />
    case "textarea":
      return <TextareaFieldRenderer {...props} />
    case "number":
      return <NumberFieldRenderer {...props} />
    case "boolean":
      return <BooleanFieldRenderer {...props} />
    case "select":
      return <SelectFieldRenderer {...props} />
    default:
      return <TextFieldRenderer {...props} />
  }
}
