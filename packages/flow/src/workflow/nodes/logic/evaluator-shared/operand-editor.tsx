"use client"

import { ArrayInputPopover } from "@flow/ui/components/array-input-popover"
import { Badge } from "@flow/ui/components/badge"
import { Tooltip, TooltipTrigger } from "@flow/ui/components/tooltip"
import { AlertTriangle } from "lucide-react"
import { useCallback, useState } from "react"

import { evaluatorNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { WorkflowTypeSelect } from "../../../components/workflow-type-select/workflow-type-select"
import type {
  ExpressionVariableOption,
  WorkflowTypedValue,
} from "../../../types"
import type { WorkflowVariableType } from "../../../types/variable-types"
import {
  areStringArraysEqual,
  createArrayOperand,
  createValueOperand,
  normalizeArrayValues,
  switchOperandType,
} from "./operands"

const styles = evaluatorNodeStyles()
const ARRAY_PREVIEW_LIMIT = 3

interface OperandEditorProps {
  operand: WorkflowTypedValue
  label: string
  placeholder: string
  variables: ExpressionVariableOption[]
  allowedTypes?: WorkflowVariableType[]
  unresolvedVariableName?: string
  onChange: (nextOperand: WorkflowTypedValue) => void
}

export function OperandEditor({
  operand,
  label,
  placeholder,
  variables,
  allowedTypes,
  unresolvedVariableName,
  onChange,
}: OperandEditorProps) {
  return (
    <div className={styles.operandRow()}>
      <WorkflowTypeSelect
        ariaLabel={`${label} operand type`}
        className={styles.operandTypeSelect()}
        size="sm"
        value={operand.type}
        allowedTypes={allowedTypes}
        onChange={(value) => onChange(switchOperandType(operand, value))}
      />

      <div className={styles.operandEditor()}>
        {operand.type === "value" ? (
          <div className="relative">
            <ExpressionInput
              value={operand.value}
              placeholder={placeholder}
              variables={variables}
              onChange={(value) => onChange(createValueOperand(value))}
            />
            {unresolvedVariableName ? (
              <div className="absolute top-1 right-1 z-10">
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="z-10 h-5 border-yellow-500/80 bg-yellow-200 px-1.5 text-[10px] text-yellow-900 dark:text-yellow-200"
                  >
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Unknown
                  </Badge>
                  <Tooltip>
                    {`Could not resolve variable "{{ ${unresolvedVariableName} }}" from upstream nodes.`}
                  </Tooltip>
                </TooltipTrigger>
              </div>
            ) : null}
          </div>
        ) : (
          <ArrayOperandPopover
            label={label}
            placeholder={placeholder}
            operand={operand}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  )
}

interface ArrayOperandPopoverProps {
  operand: Extract<WorkflowTypedValue, { type: "array" }>
  label: string
  placeholder: string
  onChange: (nextOperand: WorkflowTypedValue) => void
}

function ArrayOperandPopover({
  operand,
  label,
  placeholder,
  onChange,
}: ArrayOperandPopoverProps) {
  const [open, setOpen] = useState(false)
  const [draftValues, setDraftValues] = useState(() =>
    normalizeArrayValues(operand.value)
  )

  const commitDraft = useCallback(
    (nextValues: string[]) => {
      const normalizedValues = normalizeArrayValues(nextValues)
      if (
        areStringArraysEqual(
          normalizedValues,
          normalizeArrayValues(operand.value)
        )
      ) {
        return
      }
      onChange(createArrayOperand(normalizedValues))
    },
    [onChange, operand.value]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftValues(normalizeArrayValues(operand.value))
      setOpen(true)
      return
    }

    commitDraft(draftValues)
    setOpen(false)
  }

  return (
    <ArrayInputPopover
      open={open}
      values={open ? draftValues : normalizeArrayValues(operand.value)}
      label={label}
      placeholder={placeholder}
      previewLimit={ARRAY_PREVIEW_LIMIT}
      onOpenChange={handleOpenChange}
      onValuesChange={(nextValues) =>
        setDraftValues(normalizeArrayValues(nextValues))
      }
    />
  )
}
