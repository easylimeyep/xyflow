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

import { ExpressionInput } from "../expression-input"
import type { ExpressionVariableOption, FieldOption, NodeFieldSchema } from "../../types"

type FieldValue = string | number | boolean

export interface FieldRendererProps {
  field: NodeFieldSchema
  value: FieldValue
  nodeId: string
  expressionVariables: ExpressionVariableOption[]
  onUpdateConfigField: (nodeId: string, key: string, value: FieldValue) => void
  fieldId?: string
}

function ExpressionFieldRenderer({
  field,
  value,
  nodeId,
  expressionVariables,
  onUpdateConfigField,
}: FieldRendererProps) {
  const handleChange = useCallback(
    (nextValue: string) => {
      onUpdateConfigField(nodeId, field.key, nextValue)
    },
    [field.key, nodeId, onUpdateConfigField]
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

function TextFieldRenderer({ field, value, nodeId, onUpdateConfigField, fieldId }: FieldRendererProps) {
  return (
    <Input
      id={fieldId}
      value={String(value)}
      placeholder={field.placeholder}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onUpdateConfigField(nodeId, field.key, event.target.value)
      }
    />
  )
}

function TextareaFieldRenderer({ field, value, nodeId, onUpdateConfigField, fieldId }: FieldRendererProps) {
  return (
    <Textarea
      id={fieldId}
      value={String(value)}
      placeholder={field.placeholder}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
        onUpdateConfigField(nodeId, field.key, event.target.value)
      }
    />
  )
}

function NumberFieldRenderer({ field, value, nodeId, onUpdateConfigField, fieldId }: FieldRendererProps) {
  return (
    <Input
      id={fieldId}
      type="number"
      value={String(value)}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onUpdateConfigField(nodeId, field.key, Number(event.target.value) || 0)
      }
    />
  )
}

function BooleanFieldRenderer({ field, value, nodeId, onUpdateConfigField, fieldId }: FieldRendererProps) {
  return (
    <label htmlFor={fieldId} className="inline-flex items-center gap-2 text-xs">
      <input
        id={fieldId}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onUpdateConfigField(nodeId, field.key, event.target.checked)
        }
      />
      Enabled
    </label>
  )
}

function SelectFieldRenderer({ field, value, nodeId, onUpdateConfigField }: FieldRendererProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(nextValue) => onUpdateConfigField(nodeId, field.key, nextValue)}
    >
      <SelectTrigger className="w-full">
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

export function resolveFieldRenderer(
  field: NodeFieldSchema
): React.FC<FieldRendererProps> {
  const isExpressionField =
    field.ui === "expression" && (field.type === "text" || field.type === "textarea")

  if (isExpressionField) return ExpressionFieldRenderer

  switch (field.type) {
    case "text":
      return TextFieldRenderer
    case "textarea":
      return TextareaFieldRenderer
    case "number":
      return NumberFieldRenderer
    case "boolean":
      return BooleanFieldRenderer
    case "select":
      return SelectFieldRenderer
    default:
      return TextFieldRenderer
  }
}
