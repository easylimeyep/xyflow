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
import type { NodeConfigUpdate } from "../../store/types"
import type { ExpressionVariableOption, FieldOption, NodeFieldSchema } from "../../types"

type FieldValue = string | number | boolean

export interface FieldRendererProps {
  field: NodeFieldSchema
  value: FieldValue
  nodeId: string
  nodeKind: NodeConfigUpdate["kind"]
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
      } as NodeConfigUpdate)
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
        } as NodeConfigUpdate)
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
        } as NodeConfigUpdate)
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
        } as NodeConfigUpdate)
      }
    />
  )
}

function BooleanFieldRenderer({ field, value, nodeId, nodeKind, onUpdateConfigField, fieldId }: FieldRendererProps) {
  return (
    <label htmlFor={fieldId} className="inline-flex items-center gap-2 text-xs">
      <input
        id={fieldId}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onUpdateConfigField(nodeId, {
            kind: nodeKind,
            key: field.key,
            value: event.target.checked,
          } as NodeConfigUpdate)
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
        } as NodeConfigUpdate)
      }
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
