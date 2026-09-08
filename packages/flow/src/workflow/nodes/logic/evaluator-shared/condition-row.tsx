"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flow/ui/components/select"
import { SortableItemHandle } from "@flow/ui/components/sortable"
import { GripVertical, Trash2 } from "lucide-react"
import { useEffect, useMemo } from "react"

import { evaluatorNodeStyles } from "../../../../styles/components/nodes"
import type {
  ConditionOperator,
  EvaluatorCondition,
  ExpressionVariableOption,
  WorkflowEvaluatorOperatorCatalog,
  WorkflowTypedValue,
} from "../../../types"
import type { WorkflowVariableType } from "../../../types/variable-types"
import { OperandEditor } from "./operand-editor"
import {
  getAllowedRightOperandTypes,
  reconcileRightOperand,
  resolveEffectiveLeftOperandType,
} from "./operands"

const styles = evaluatorNodeStyles()

interface ConditionRowProps {
  condition: EvaluatorCondition
  variables: ExpressionVariableOption[]
  variableTypes: Record<string, WorkflowVariableType>
  operators: WorkflowEvaluatorOperatorCatalog
  canDelete: boolean
  showDragHandle: boolean
  isOverlay?: boolean
  onUpdate: (id: string, patch: Partial<Omit<EvaluatorCondition, "id">>) => void
  onDelete: (id: string) => void
}

export function ConditionRow({
  condition,
  variables,
  variableTypes,
  operators,
  canDelete,
  showDragHandle,
  isOverlay,
  onUpdate,
  onDelete,
}: ConditionRowProps) {
  const effectiveLeftOperand = useMemo(
    () => resolveEffectiveLeftOperandType(condition.left, variableTypes),
    [condition.left, variableTypes]
  )
  const activeOperators = operators[effectiveLeftOperand.type]

  const selectedOperator = activeOperators.find(
    (op) => op.id === condition.operator
  )
  const allowedRightTypes = getAllowedRightOperandTypes(selectedOperator)
  const needsTarget = allowedRightTypes.length > 0

  useEffect(() => {
    if (selectedOperator || activeOperators.length === 0) {
      return
    }

    const fallbackOperator = activeOperators[0]
    if (!fallbackOperator) {
      return
    }

    onUpdate(condition.id, {
      operator: fallbackOperator.id,
      right: reconcileRightOperand(condition.right, fallbackOperator).right,
    })
  }, [
    activeOperators,
    condition.id,
    condition.right,
    onUpdate,
    selectedOperator,
  ])

  const updateLeftOperand = (left: WorkflowTypedValue) => {
    const nextEffectiveLeftOperand = resolveEffectiveLeftOperandType(
      left,
      variableTypes
    )
    const nextOperators = operators[nextEffectiveLeftOperand.type]
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
          unresolvedVariableName={effectiveLeftOperand.unresolvedVariableName}
          onChange={updateLeftOperand}
        />

        <div className={styles.operatorRow()}>
          <Select
            aria-label="Condition operator"
            selectedKey={condition.operator}
            onSelectionChange={(key) =>
              updateOperator(key as ConditionOperator)
            }
          >
            <SelectTrigger size="sm" className={styles.operatorSelect()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activeOperators.map((operator) => (
                <SelectItem key={operator.id} id={operator.id}>
                  {operator.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

interface LogicalOperatorRowProps {
  value: "and" | "or"
  isInteractive: boolean
  onChange: (v: "and" | "or") => void
}

export function LogicalOperatorRow({
  value,
  isInteractive,
  onChange,
}: LogicalOperatorRowProps) {
  return (
    <div className={styles.logicalOperatorSeparator()}>
      {isInteractive ? (
        <Select
          aria-label="Logical operator"
          selectedKey={value}
          onSelectionChange={(key) => onChange(key as "and" | "or")}
        >
          <SelectTrigger size="sm" className={styles.logicalOperatorSelect()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem id="and">AND</SelectItem>
            <SelectItem id="or">OR</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <span className={styles.logicalOperatorBadge()}>
          {value.toUpperCase()}
        </span>
      )}
    </div>
  )
}
