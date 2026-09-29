"use client"

import {
  ArrayInputPopover,
  type ArrayInputEntryMeta,
  type ArrayInputEntryProps,
} from "@flow/ui/components/array-input-popover"
import { useCallback, useState } from "react"

import { evaluatorNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { searchFieldStyles } from "../../../../styles/components/nodes"
import type { FieldSearchStatus } from "../../../store"
import { WorkflowTypeSelect } from "../../../components/workflow-type-select/workflow-type-select"
import type {
  ExpressionVariableOption,
  WorkflowOperandValue,
} from "../../../types"
import type { WorkflowVariableType } from "../../../types/variable-types"
import {
  areStringArraysEqual,
  createArrayOperand,
  createValueOperand,
  findUnresolvedVariable,
  isVariableReference,
  normalizeArrayValues,
  switchOperandType,
  unresolvedVariableMessage,
} from "./operands"
import { UnresolvedVariableChip } from "./unresolved-variable-chip"

const styles = evaluatorNodeStyles()
const ARRAY_PREVIEW_LIMIT = 3

interface OperandEditorProps {
  operand: WorkflowOperandValue
  label: string
  placeholder: string
  variables: ExpressionVariableOption[]
  variableTypes: Record<string, string>
  allowedTypes?: WorkflowVariableType[]
  onChange: (nextOperand: WorkflowOperandValue) => void
  /**
   * This operand's canvas-search mark. An array operand carries it on the
   * control that opens its values, since the values themselves are collapsed.
   */
  searchState?: FieldSearchStatus
}

export function OperandEditor({
  operand,
  label,
  placeholder,
  variables,
  variableTypes,
  allowedTypes,
  onChange,
  searchState = "none",
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
          <OperandExpressionInput
            searchState={searchState}
            value={operand.value}
            placeholder={placeholder}
            variables={variables}
            variableTypes={variableTypes}
            onChange={(value) => onChange(createValueOperand(value))}
          />
        ) : (
          <div
            className={searchFieldStyles({ searchState })}
            data-field-search-state={
              searchState === "none" ? undefined : searchState
            }
          >
            <ArrayOperandPopover
              label={label}
              placeholder={placeholder}
              operand={operand}
              variables={variables}
              variableTypes={variableTypes}
              onChange={onChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface OperandExpressionInputProps {
  value: string
  placeholder: string
  variables: ExpressionVariableOption[]
  variableTypes: Record<string, string>
  ariaLabel?: string
  onChange: (nextValue: string) => void
  onLiveChange?: (nextValue: string) => void
  searchState?: FieldSearchStatus
}

function OperandExpressionInput({
  value,
  placeholder,
  variables,
  variableTypes,
  ariaLabel,
  onChange,
  onLiveChange,
  searchState,
}: OperandExpressionInputProps) {
  const unresolvedVariableName = findUnresolvedVariable(value, variableTypes)

  return (
    <div
      className="relative"
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
    >
      <ExpressionInput
        value={value}
        placeholder={placeholder}
        variables={variables}
        onChange={onChange}
        onLiveChange={onLiveChange}
        searchState={searchState}
      />
      {unresolvedVariableName ? (
        <UnresolvedVariableChip variableName={unresolvedVariableName} />
      ) : null}
    </div>
  )
}

interface ArrayOperandPopoverProps {
  operand: Extract<WorkflowOperandValue, { type: "array" }>
  label: string
  placeholder: string
  variables: ExpressionVariableOption[]
  variableTypes: Record<string, string>
  onChange: (nextOperand: WorkflowOperandValue) => void
}

function ArrayOperandPopover({
  operand,
  label,
  placeholder,
  variables,
  variableTypes,
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

  // Live edits feed the draft too, so closing the popover while a row still
  // has focus keeps what was typed into it.
  const renderEntry = ({
    value,
    ariaLabel,
    onChange,
  }: ArrayInputEntryProps) => (
    <OperandExpressionInput
      value={value}
      placeholder={placeholder}
      variables={variables}
      variableTypes={variableTypes}
      ariaLabel={ariaLabel}
      onChange={onChange}
      onLiveChange={onChange}
    />
  )

  const getEntryMeta = (value: string): ArrayInputEntryMeta => {
    const unresolvedVariableName = findUnresolvedVariable(value, variableTypes)
    return {
      variant: isVariableReference(value) ? "variable" : "literal",
      warning: unresolvedVariableName
        ? unresolvedVariableMessage(unresolvedVariableName)
        : undefined,
    }
  }

  return (
    <ArrayInputPopover
      open={open}
      values={open ? draftValues : normalizeArrayValues(operand.value)}
      label={label}
      placeholder={placeholder}
      previewLimit={ARRAY_PREVIEW_LIMIT}
      popoverClassName={styles.arrayOperandPopover()}
      renderEntry={renderEntry}
      getEntryMeta={getEntryMeta}
      onOpenChange={handleOpenChange}
      onValuesChange={(nextValues) =>
        setDraftValues(normalizeArrayValues(nextValues))
      }
    />
  )
}
