"use client"

import type { NodeProps } from "@xyflow/react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@workspace/ui/components/sortable"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

import { evaluatorNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { WorkflowTypePicker } from "../../../components/workflow-type-picker/workflow-type-picker"
import type {
  EvaluatorCondition,
  ConditionOperator,
  ExpressionVariableOption,
  WorkflowTypedValue,
  WorkflowEvaluatorOperatorCatalog,
  WorkflowEvaluatorOperatorOption,
} from "../../../types"
import type { WorkflowVariableType } from "../../../types/variable-types"
import { NodeShell } from "../../node-shell/node-shell"
import {
  asText,
  useBaseNodeData,
  useVariableIdentifierField,
} from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"
import { evaluator } from "./definition"

const styles = evaluatorNodeStyles()
const ARRAY_PREVIEW_LIMIT = 3

function createValueOperand(value = ""): WorkflowTypedValue {
  return { type: "value", value }
}

function normalizeArrayValues(values: string[]): string[] {
  return values.length > 0 ? values : [""]
}

function createArrayOperand(value: string[] = [""]): WorkflowTypedValue {
  return { type: "array", value: normalizeArrayValues(value) }
}

function createEmptyOperand(type: WorkflowVariableType): WorkflowTypedValue {
  return type === "array" ? createArrayOperand() : createValueOperand()
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  )
}

function switchOperandType(
  operand: WorkflowTypedValue,
  nextType: WorkflowVariableType
): WorkflowTypedValue {
  if (operand.type === nextType) {
    return operand
  }

  if (nextType === "value") {
    return createValueOperand(
      operand.type === "array" ? (operand.value[0] ?? "") : ""
    )
  }

  return createArrayOperand(
    operand.type === "value" && operand.value !== "" ? [operand.value] : [""]
  )
}

function createDefaultCondition(
  operator: WorkflowEvaluatorOperatorOption
): EvaluatorCondition {
  return {
    id: crypto.randomUUID(),
    left: createValueOperand(),
    operator: operator.id,
    ...reconcileRightOperand(undefined, operator),
  }
}

function getAllowedRightOperandTypes(
  operator: WorkflowEvaluatorOperatorOption | undefined
): WorkflowVariableType[] {
  if (!operator || operator.allowTypes.includes("none")) {
    return []
  }

  return operator.allowTypes.filter(
    (type): type is WorkflowVariableType => type === "value" || type === "array"
  )
}

function reconcileRightOperand(
  currentRight: WorkflowTypedValue | undefined,
  operator: WorkflowEvaluatorOperatorOption | undefined
): Pick<EvaluatorCondition, "right"> {
  const allowedTypes = getAllowedRightOperandTypes(operator)
  const defaultRightType = allowedTypes[0]

  if (!defaultRightType) {
    return {}
  }

  if (currentRight && allowedTypes.includes(currentRight.type)) {
    return { right: currentRight }
  }

  return { right: createEmptyOperand(defaultRightType) }
}

// ─── ConditionRow ────────────────────────────────────────────────────────────

interface ConditionRowProps {
  condition: EvaluatorCondition
  variables: ExpressionVariableOption[]
  operators: WorkflowEvaluatorOperatorCatalog
  canDelete: boolean
  showDragHandle: boolean
  isOverlay?: boolean
  onUpdate: (id: string, patch: Partial<Omit<EvaluatorCondition, "id">>) => void
  onDelete: (id: string) => void
}

interface OperandEditorProps {
  operand: WorkflowTypedValue
  label: string
  placeholder: string
  variables: ExpressionVariableOption[]
  allowedTypes?: WorkflowVariableType[]
  onChange: (nextOperand: WorkflowTypedValue) => void
}

function OperandEditor({
  operand,
  label,
  placeholder,
  variables,
  allowedTypes,
  onChange,
}: OperandEditorProps) {
  return (
    <div className={styles.operandRow()}>
      <WorkflowTypePicker
        ariaLabel={`${label} operand type`}
        className={styles.operandTypeSelect()}
        size="sm"
        value={operand.type}
        allowedTypes={allowedTypes}
        onChange={(value) => onChange(switchOperandType(operand, value))}
      />

      <div className={styles.operandEditor()}>
        {operand.type === "value" ? (
          <ExpressionInput
            value={operand.value}
            placeholder={placeholder}
            variables={variables}
            onChange={(value) => onChange(createValueOperand(value))}
          />
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
  const previewSourceValues = open
    ? draftValues.length
      ? draftValues
      : normalizeArrayValues(operand.value)
    : normalizeArrayValues(operand.value)
  const previewValues = previewSourceValues.filter(
    (value) => value.trim() !== ""
  )
  const visiblePreviewValues = previewValues.slice(0, ARRAY_PREVIEW_LIMIT)
  const hiddenPreviewCount = Math.max(
    0,
    previewValues.length - visiblePreviewValues.length
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

  const updateArrayEntry = (index: number, nextValue: string) => {
    setDraftValues((currentValues) =>
      normalizeArrayValues(
        currentValues.map((entry, entryIndex) =>
          entryIndex === index ? nextValue : entry
        )
      )
    )
  }

  const addArrayEntry = () => {
    setDraftValues((currentValues) => [
      ...normalizeArrayValues(currentValues),
      "",
    ])
  }

  const removeArrayEntry = (index: number) => {
    setDraftValues((currentValues) =>
      normalizeArrayValues(
        currentValues.filter((_, entryIndex) => entryIndex !== index)
      )
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={styles.operandArrayTrigger()}
          aria-label={`Edit ${label} array values`}
        >
          {visiblePreviewValues.length > 0 ? (
            <>
              <span className={styles.operandArrayPreviewList()}>
                {visiblePreviewValues.map((value, index) => (
                  <Badge
                    key={`${value}-${index}`}
                    variant="outline"
                    className={styles.operandArrayPreviewChip()}
                    title={value}
                  >
                    <span className={styles.operandArrayPreviewChipText()}>
                      {value}
                    </span>
                  </Badge>
                ))}
              </span>
              {hiddenPreviewCount > 0 ? (
                <Badge
                  variant="secondary"
                  className={styles.operandArrayOverflowBadge()}
                >
                  +{hiddenPreviewCount}
                </Badge>
              ) : null}
            </>
          ) : (
            <span className={styles.operandArrayTriggerLabel()}>
              {placeholder}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={styles.operandArrayPopover()}>
        <div className={styles.operandArrayList()}>
          {draftValues.map((entry, index) => (
            <div key={index} className={styles.operandArrayRow()}>
              <Input
                aria-label={`${label} array value ${index + 1}`}
                className={styles.operandArrayInput()}
                value={entry}
                onChange={(event) =>
                  updateArrayEntry(index, event.target.value)
                }
              />
              <button
                type="button"
                aria-label={`Delete ${label} array value ${index + 1}`}
                className={styles.operandArrayDeleteButton()}
                onClick={() => removeArrayEntry(index)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="xs"
            className={styles.operandAddButton()}
            onClick={addArrayEntry}
          >
            <Plus data-icon="inline-start" />
            Add value
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ConditionRow({
  condition,
  variables,
  operators,
  canDelete,
  showDragHandle,
  isOverlay,
  onUpdate,
  onDelete,
}: ConditionRowProps) {
  const activeOperators = operators[condition.left.type]

  const selectedOperator = activeOperators.find(
    (op) => op.id === condition.operator
  )
  const allowedRightTypes = getAllowedRightOperandTypes(selectedOperator)
  const needsTarget = allowedRightTypes.length > 0

  const updateLeftOperand = (left: WorkflowTypedValue) => {
    const nextOperators = operators[left.type]
    const nextOperator =
      nextOperators.find((op) => op.id === condition.operator) ??
      nextOperators[0]

    if (!nextOperator) {
      onUpdate(condition.id, { left })
      return
    }

    onUpdate(condition.id, {
      left,
      operator: nextOperator.id,
      right: reconcileRightOperand(condition.right, nextOperator).right,
    })
  }

  const updateOperator = (operatorId: ConditionOperator) => {
    const nextOperator = activeOperators.find((op) => op.id === operatorId)

    onUpdate(condition.id, {
      operator: operatorId,
      right: reconcileRightOperand(condition.right, nextOperator).right,
    })
  }

  return (
    <div className={styles.conditionRow()}>
      {showDragHandle && (
        <div className={styles.leftControls()}>
          <SortableItemHandle asChild disabled={isOverlay}>
            <button type="button" className={styles.dragHandle()}>
              <GripVertical className="h-3 w-3" />
            </button>
          </SortableItemHandle>

          {canDelete && (
            <button
              type="button"
              className={styles.deleteButton()}
              onClick={() => onDelete(condition.id)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <div className={styles.conditionBody()}>
        <OperandEditor
          operand={condition.left}
          label="Left"
          placeholder="value"
          variables={variables}
          onChange={updateLeftOperand}
        />

        <div className={styles.operatorRow()}>
          <NativeSelect
            aria-label="Condition operator"
            className={styles.operatorSelect()}
            size="sm"
            value={condition.operator}
            onChange={(event) =>
              updateOperator(event.target.value as ConditionOperator)
            }
          >
            {activeOperators.map((operator) => (
              <NativeSelectOption key={operator.id} value={operator.id}>
                {operator.value}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {needsTarget && condition.right ? (
          <OperandEditor
            operand={condition.right}
            label="Right"
            placeholder="target value"
            variables={variables}
            allowedTypes={allowedRightTypes}
            onChange={(right) => onUpdate(condition.id, { right })}
          />
        ) : null}
      </div>
    </div>
  )
}

// ─── LogicalOperatorRow ───────────────────────────────────────────────────────

interface LogicalOperatorRowProps {
  value: "and" | "or"
  isInteractive: boolean
  onChange: (v: "and" | "or") => void
}

function LogicalOperatorRow({
  value,
  isInteractive,
  onChange,
}: LogicalOperatorRowProps) {
  return (
    <div className={styles.logicalOperatorSeparator()}>
      {isInteractive ? (
        <NativeSelect
          aria-label="Logical operator"
          className={styles.logicalOperatorSelect()}
          size="sm"
          value={value}
          onChange={(event) => onChange(event.target.value as "and" | "or")}
        >
          <NativeSelectOption value="and">AND</NativeSelectOption>
          <NativeSelectOption value="or">OR</NativeSelectOption>
        </NativeSelect>
      ) : (
        <span className={styles.logicalOperatorBadge()}>
          {value.toUpperCase()}
        </span>
      )}
    </div>
  )
}

// ─── EvaluatorNode ───────────────────────────────────────────────────────────────

export function EvaluatorNode({ id, data, selected }: NodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Evaluator"
  const {
    expressionVariables,
    evaluatorOperators,
    enableEvaluatorMultipleConditions,
    nodeValidationMessages,
    updateNodeConfig,
  } = useNodeStoreData(id)

  const conditions = useMemo(
    () => (config.conditions as EvaluatorCondition[] | undefined) ?? [],
    [config.conditions]
  )
  const logicalOperator =
    (config.logicalOperator as "and" | "or" | undefined) ?? "and"
  const isCaseSensitiveFromStore = config.caseSensitive === true
  const resultLabel = asText(config.label).trim() || "conditionMatched"
  const resultLabelField = useVariableIdentifierField({
    value: resultLabel,
    onCommit: (nextLabel) => {
      updateNodeConfig(id, {
        kind: "evaluator",
        key: "label",
        value: nextLabel,
      })
    },
  })

  const setConditions = useCallback(
    (next: EvaluatorCondition[]) => {
      updateNodeConfig(id, {
        kind: "evaluator",
        key: "conditions",
        value: next,
      })
    },
    [id, updateNodeConfig]
  )

  const handleAddCondition = useCallback(() => {
    const defaultOperator = evaluatorOperators.value[0]
    if (!defaultOperator) return

    setConditions([...conditions, createDefaultCondition(defaultOperator)])
  }, [evaluatorOperators, conditions, setConditions])

  const handleUpdateCondition = useCallback(
    (conditionId: string, patch: Partial<Omit<EvaluatorCondition, "id">>) => {
      setConditions(
        conditions.map((condition) => {
          if (condition.id !== conditionId) {
            return condition
          }

          if ("right" in patch && patch.right === undefined) {
            const nextCondition = { ...condition, ...patch }
            delete nextCondition.right
            return nextCondition
          }

          return { ...condition, ...patch }
        })
      )
    },
    [conditions, setConditions]
  )

  const handleDeleteCondition = useCallback(
    (conditionId: string) => {
      if (conditions.length <= 1) return
      setConditions(conditions.filter((c) => c.id !== conditionId))
    },
    [conditions, setConditions]
  )

  const handleReorder = useCallback(
    (next: EvaluatorCondition[]) => {
      setConditions(next)
    },
    [setConditions]
  )

  const handleOperatorChange = useCallback(
    (v: "and" | "or") => {
      updateNodeConfig(id, {
        kind: "evaluator",
        key: "logicalOperator",
        value: v,
      })
    },
    [id, updateNodeConfig]
  )

  const visibleConditions = enableEvaluatorMultipleConditions
    ? conditions
    : conditions.slice(0, 1)
  const showDragHandle =
    enableEvaluatorMultipleConditions && visibleConditions.length > 1

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle={`${conditions.length} condition${conditions.length !== 1 ? "s" : ""}`}
      selected={selected}
      outputs={evaluator.outputs}
      validationMessages={nodeValidationMessages}
    >
      <div className={styles.root()}>
        <div className="space-y-1">
          <Label className={styles.label()}>Label</Label>
          <Input
            ref={resultLabelField.inputRef}
            value={resultLabelField.shownValue}
            placeholder="conditionMatched"
            onFocus={resultLabelField.onFocus}
            onChange={(event) => resultLabelField.onChange(event.target.value)}
            onBlur={resultLabelField.onBlur}
            onKeyDown={resultLabelField.onKeyDown}
          />
          {resultLabelField.errorText ? (
            <p className="text-[11px] text-destructive">
              {resultLabelField.errorText}
            </p>
          ) : null}
        </div>

        <label className={styles.optionToggleWrap()}>
          <Checkbox
            checked={isCaseSensitiveFromStore}
            className={styles.optionToggle()}
            onCheckedChange={(checked) => {
              updateNodeConfig(id, {
                kind: "evaluator",
                key: "caseSensitive",
                value: checked === true,
              })
            }}
          />
          <span className={styles.optionToggleLabel()}>Case sensitive</span>
        </label>

        <div className={styles.conditionList()}>
          <Sortable
            value={visibleConditions}
            onValueChange={handleReorder}
            getItemValue={(c) => c.id}
            orientation="vertical"
          >
            <SortableContent>
              {visibleConditions.map((condition, index) => (
                <SortableItem key={condition.id} value={condition.id}>
                  {enableEvaluatorMultipleConditions && index > 0 && (
                    <LogicalOperatorRow
                      value={logicalOperator}
                      isInteractive={index === 1}
                      onChange={handleOperatorChange}
                    />
                  )}
                  <ConditionRow
                    condition={condition}
                    variables={expressionVariables}
                    operators={evaluatorOperators}
                    canDelete={
                      enableEvaluatorMultipleConditions &&
                      visibleConditions.length > 1
                    }
                    showDragHandle={showDragHandle}
                    onUpdate={handleUpdateCondition}
                    onDelete={handleDeleteCondition}
                  />
                </SortableItem>
              ))}
            </SortableContent>

            <SortableOverlay>
              {({ value }) => {
                const overlayCondition = visibleConditions.find(
                  (c) => c.id === value
                )
                if (!overlayCondition) return null
                return (
                  <SortableItem value={overlayCondition.id}>
                    <ConditionRow
                      condition={overlayCondition}
                      variables={expressionVariables}
                      operators={evaluatorOperators}
                      canDelete={false}
                      showDragHandle={true}
                      isOverlay
                      onUpdate={() => undefined}
                      onDelete={() => undefined}
                    />
                  </SortableItem>
                )
              }}
            </SortableOverlay>
          </Sortable>
        </div>

        {enableEvaluatorMultipleConditions && (
          <Button
            variant="ghost"
            size="sm"
            className={styles.addButton()}
            onClick={handleAddCondition}
          >
            + Add Condition
          </Button>
        )}
      </div>
    </NodeShell>
  )
}
