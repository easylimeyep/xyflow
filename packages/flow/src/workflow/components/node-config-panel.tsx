"use client"

import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useCallback, type ChangeEvent } from "react"

import { ExpressionInput } from "./expression-input"
import { workflowNodeRegistry } from "../node-registry"
import type {
  ExpressionVariableOption,
  FieldOption,
  NodeFieldSchema,
  WorkflowNode,
} from "../types"

type FieldValue = string | number | boolean

interface NodeConfigPanelProps {
  selectedNode: WorkflowNode | null
  expressionVariables: ExpressionVariableOption[]
  onUpdateLabel: (nodeId: string, nextLabel: string) => void
  onUpdateConfigField: (nodeId: string, key: string, value: FieldValue) => void
}

interface ExpressionFieldInputProps {
  value: string
  placeholder?: string
  variables: ExpressionVariableOption[]
  nodeId: string
  fieldKey: string
  onUpdateConfigField: (nodeId: string, key: string, value: FieldValue) => void
}

function ExpressionFieldInput({
  value,
  placeholder,
  variables,
  nodeId,
  fieldKey,
  onUpdateConfigField,
}: ExpressionFieldInputProps) {
  const handleChange = useCallback(
    (nextValue: string) => {
      onUpdateConfigField(nodeId, fieldKey, nextValue)
    },
    [fieldKey, nodeId, onUpdateConfigField]
  )

  return (
    <ExpressionInput
      value={value}
      placeholder={placeholder}
      variables={variables}
      onChange={handleChange}
    />
  )
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

export function NodeConfigPanel({
  selectedNode,
  expressionVariables,
  onUpdateLabel,
  onUpdateConfigField,
}: NodeConfigPanelProps) {
  if (!selectedNode) {
    return (
      <aside className="w-80 border-l bg-background p-3">
        <h2 className="text-sm font-semibold">Node Config</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Select a node to edit its settings.
        </p>
      </aside>
    )
  }

  const { kind } = selectedNode.data
  const definition = workflowNodeRegistry[kind]

  return (
    <aside className="w-80 space-y-3 border-l bg-background p-3">
      <h2 className="text-sm font-semibold">Node Config</h2>
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Label</label>
        <Input
          value={selectedNode.data.label}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onUpdateLabel(selectedNode.id, event.target.value)
          }
        />
      </div>

      {definition.fields.map((field: NodeFieldSchema) => {
        const rawValue = selectedNode.data.config[field.key as keyof typeof selectedNode.data.config]
        const value = asFieldValue(rawValue, "", field.type)
        const isExpressionField =
          field.ui === "expression" && (field.type === "text" || field.type === "textarea")

        return (
          <div key={field.key} className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              {field.label}
            </label>
            {isExpressionField ? (
              <ExpressionFieldInput
                value={String(value)}
                placeholder={field.placeholder}
                variables={expressionVariables}
                nodeId={selectedNode.id}
                fieldKey={field.key}
                onUpdateConfigField={onUpdateConfigField}
              />
            ) : null}
            {field.type === "text" && !isExpressionField ? (
              <Input
                value={String(value)}
                placeholder={field.placeholder}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onUpdateConfigField(selectedNode.id, field.key, event.target.value)
                }
              />
            ) : null}
            {field.type === "textarea" && !isExpressionField ? (
              <Textarea
                value={String(value)}
                placeholder={field.placeholder}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  onUpdateConfigField(selectedNode.id, field.key, event.target.value)
                }
              />
            ) : null}
            {field.type === "number" ? (
              <Input
                type="number"
                value={String(value)}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onUpdateConfigField(
                    selectedNode.id,
                    field.key,
                    Number(event.target.value) || 0
                  )
                }
              />
            ) : null}
            {field.type === "boolean" ? (
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onUpdateConfigField(
                      selectedNode.id,
                      field.key,
                      event.target.checked
                    )
                  }
                />
                Enabled
              </label>
            ) : null}
            {field.type === "select" ? (
              <Select
                value={String(value)}
                onValueChange={(nextValue) =>
                  onUpdateConfigField(selectedNode.id, field.key, nextValue)
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
            ) : null}
            {field.description ? (
              <p className="text-[11px] text-muted-foreground">{field.description}</p>
            ) : null}
          </div>
        )
      })}
    </aside>
  )
}
