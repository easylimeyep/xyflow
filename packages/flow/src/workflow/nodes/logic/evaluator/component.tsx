"use client"

import type { NodeProps } from "@xyflow/react"
import { Button } from "@workspace/ui/components/button"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@workspace/ui/components/sortable"
import { GripVertical, Trash2 } from "lucide-react"
import { useCallback, useMemo } from "react"

import { evaluatorNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import type {
  EvaluatorCondition,
  ConditionOperator,
  ExpressionVariableOption,
  WorkflowEvaluatorOperatorOption,
} from "../../../types"
import { DEFAULT_EVALUATOR_OPERATOR_ID } from "../../../types"
import { NodeShell } from "../../node-shell/node-shell"
import { useBaseNodeData } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"
import { evaluator } from "./definition"

const styles = evaluatorNodeStyles()

// ─── ConditionRow ────────────────────────────────────────────────────────────

interface ConditionRowProps {
  condition: EvaluatorCondition
  variables: ExpressionVariableOption[]
  operators: WorkflowEvaluatorOperatorOption[]
  canDelete: boolean
  showDragHandle: boolean
  isOverlay?: boolean
  onUpdate: (id: string, patch: Partial<Omit<EvaluatorCondition, "id">>) => void
  onDelete: (id: string) => void
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
  const activeOperators = useMemo(() => {
    const hasCurrentOperator = operators.some(
      (op) => op.id === condition.operator
    )
    if (hasCurrentOperator) {
      return operators
    }

    return [
      ...operators,
      {
        id: condition.operator,
        value: condition.operator,
        requiresTarget: condition.targetValue !== undefined,
      },
    ]
  }, [condition.operator, condition.targetValue, operators])

  const selectedOperator = activeOperators.find(
    (op) => op.id === condition.operator
  )
  const needsTarget = selectedOperator?.requiresTarget ?? false

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
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <ExpressionInput
              value={condition.value}
              placeholder="value"
              variables={variables}
              onChange={(v) => onUpdate(condition.id, { value: v })}
            />
          </div>

          <div className={styles.operatorRow()}>
            <NativeSelect
              aria-label="Condition operator"
              className={styles.operatorSelect()}
              size="sm"
              value={condition.operator}
              onChange={(event) =>
                onUpdate(condition.id, {
                  operator: event.target.value as ConditionOperator,
                })
              }
            >
              {activeOperators.map((operator) => (
                <NativeSelectOption key={operator.id} value={operator.id}>
                  {operator.value}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>

        {needsTarget && (
          <ExpressionInput
            value={condition.targetValue ?? ""}
            placeholder="target value"
            variables={variables}
            onChange={(v) => onUpdate(condition.id, { targetValue: v })}
          />
        )}
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
    updateNodeConfig,
  } = useNodeStoreData(id)

  const conditions = useMemo(
    () => (config.conditions as EvaluatorCondition[] | undefined) ?? [],
    [config.conditions]
  )
  const logicalOperator =
    (config.logicalOperator as "and" | "or" | undefined) ?? "and"

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
    const defaultOperatorId =
      evaluatorOperators[0]?.id ?? DEFAULT_EVALUATOR_OPERATOR_ID

    setConditions([
      ...conditions,
      {
        id: crypto.randomUUID(),
        value: "",
        operator: defaultOperatorId,
        targetValue: "",
      },
    ])
  }, [evaluatorOperators, conditions, setConditions])

  const handleUpdateCondition = useCallback(
    (conditionId: string, patch: Partial<Omit<EvaluatorCondition, "id">>) => {
      setConditions(
        conditions.map((c) => (c.id === conditionId ? { ...c, ...patch } : c))
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
    >
      <div className={styles.root()}>
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
