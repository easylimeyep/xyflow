"use client"

import type { NodeProps } from "@xyflow/react"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@workspace/ui/components/sortable"
import { GripVertical, Trash2 } from "lucide-react"
import { useCallback, useMemo } from "react"

import { branchNodeStyles } from "../../../styles/components/nodes"
import { ExpressionInput } from "../../components/expression-input"
import type {
  BranchCondition,
  ConditionOperator,
  ExpressionVariableOption,
  WorkflowBranchOperatorOption,
} from "../../types"
import { DEFAULT_BRANCH_OPERATOR_ID } from "../../types"
import { branch } from "./branch"
import { NodeShell } from "../node-shell/node-shell"
import { useBaseNodeData } from "../shared"
import { useNodeStoreData } from "../shared/use-node-store-data"

const styles = branchNodeStyles()

// ─── ConditionRow ────────────────────────────────────────────────────────────

interface ConditionRowProps {
  condition: BranchCondition
  variables: ExpressionVariableOption[]
  operators: WorkflowBranchOperatorOption[]
  canDelete: boolean
  showDragHandle: boolean
  isOverlay?: boolean
  onUpdate: (id: string, patch: Partial<Omit<BranchCondition, "id">>) => void
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
    const hasCurrentOperator = operators.some((op) => op.id === condition.operator)
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

  const selectedOperator = activeOperators.find((op) => op.id === condition.operator)
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
            <Select
              value={condition.operator}
              onValueChange={(v) =>
                onUpdate(condition.id, { operator: v as ConditionOperator })
              }
            >
              <SelectTrigger className={styles.operatorSelect()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeOperators.map((operator) => (
                  <SelectItem
                    key={operator.id}
                    value={operator.id}
                    className="text-[11px]"
                  >
                    {operator.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <Select
          value={value}
          onValueChange={(v) => onChange(v as "and" | "or")}
        >
          <SelectTrigger className={styles.logicalOperatorSelect()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and" className="text-[10px]">
              AND
            </SelectItem>
            <SelectItem value="or" className="text-[10px]">
              OR
            </SelectItem>
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

// ─── BranchNode ───────────────────────────────────────────────────────────────

export function BranchNode({ id, data, selected }: NodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Branch"
  const { expressionVariables, branchOperators, updateNodeConfig } =
    useNodeStoreData(id)

  const conditions = useMemo(
    () => (config.conditions as BranchCondition[] | undefined) ?? [],
    [config.conditions]
  )
  const logicalOperator =
    (config.logicalOperator as "and" | "or" | undefined) ?? "and"

  const setConditions = useCallback(
    (next: BranchCondition[]) => {
      updateNodeConfig(id, { kind: "branch", key: "conditions", value: next })
    },
    [id, updateNodeConfig]
  )

  const handleAddCondition = useCallback(() => {
    const defaultOperatorId =
      branchOperators[0]?.id ?? DEFAULT_BRANCH_OPERATOR_ID

    setConditions([
      ...conditions,
      {
        id: crypto.randomUUID(),
        value: "",
        operator: defaultOperatorId,
        targetValue: "",
      },
    ])
  }, [branchOperators, conditions, setConditions])

  const handleUpdateCondition = useCallback(
    (conditionId: string, patch: Partial<Omit<BranchCondition, "id">>) => {
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
    (next: BranchCondition[]) => {
      setConditions(next)
    },
    [setConditions]
  )

  const handleOperatorChange = useCallback(
    (v: "and" | "or") => {
      updateNodeConfig(id, { kind: "branch", key: "logicalOperator", value: v })
    },
    [id, updateNodeConfig]
  )

  const showDragHandle = conditions.length > 1

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle={`${conditions.length} condition${conditions.length !== 1 ? "s" : ""}`}
      selected={selected}
      outputs={branch.outputs}
    >
      <div className={styles.root()}>
        <div className={styles.conditionList()}>
          <Sortable
            value={conditions}
            onValueChange={handleReorder}
            getItemValue={(c) => c.id}
            orientation="vertical"
          >
            <SortableContent>
              {conditions.map((condition, index) => (
                <SortableItem key={condition.id} value={condition.id}>
                  {index > 0 && (
                    <LogicalOperatorRow
                      value={logicalOperator}
                      isInteractive={index === 1}
                      onChange={handleOperatorChange}
                    />
                  )}
                  <ConditionRow
                    condition={condition}
                    variables={expressionVariables}
                    operators={branchOperators}
                    canDelete={conditions.length > 1}
                    showDragHandle={showDragHandle}
                    onUpdate={handleUpdateCondition}
                    onDelete={handleDeleteCondition}
                  />
                </SortableItem>
              ))}
            </SortableContent>

            <SortableOverlay>
              {({ value }) => {
                const overlayCondition = conditions.find((c) => c.id === value)
                if (!overlayCondition) return null
                return (
                  <SortableItem value={overlayCondition.id}>
                    <ConditionRow
                      condition={overlayCondition}
                      variables={expressionVariables}
                      operators={branchOperators}
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

        <Button
          variant="ghost"
          size="sm"
          className={styles.addButton()}
          onClick={handleAddCondition}
        >
          + Add Condition
        </Button>
      </div>
    </NodeShell>
  )
}
