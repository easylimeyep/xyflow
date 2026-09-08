"use client"

import { Button } from "@flow/ui/components/button"
import { Checkbox } from "@flow/ui/components/checkbox"
import { Input } from "@flow/ui/components/input"
import { Label } from "@flow/ui/components/label"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from "@flow/ui/components/sortable"
import type { NodeProps } from "@xyflow/react"
import type { ReactNode } from "react"
import { useCallback, useMemo } from "react"

import { evaluatorNodeStyles } from "../../../../styles/components/nodes"
import type { OutputHandle } from "../../../node-registry/define-node"
import type { EvaluatorCondition, EvaluatorNodeConfig } from "../../../types"
import { NodeShell } from "../../node-shell/node-shell"
import {
  asText,
  useBaseNodeData,
  useVariableIdentifierField,
} from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"
import { ConditionRow, LogicalOperatorRow } from "./condition-row"
import { createDefaultCondition } from "./operands"

const styles = evaluatorNodeStyles()

/** The kinds rendered by this view: the Evaluator and its JSON sibling. */
export type EvaluatorViewKind = "evaluator" | "jsonEvaluator"

export interface EvaluatorViewProps {
  nodeId: string
  data: NodeProps["data"]
  selected?: boolean
  kind: EvaluatorViewKind
  /** Title shown when the node carries no label of its own. */
  fallbackTitle: string
  outputs?: OutputHandle[]
  /** Extra controls rendered under the condition list (see JSON Evaluator). */
  footer?: ReactNode
}

export function EvaluatorView({
  nodeId,
  data,
  selected,
  kind,
  fallbackTitle,
  outputs,
  footer,
}: EvaluatorViewProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || fallbackTitle
  const {
    expressionVariables,
    expressionVariableTypes,
    evaluatorOperators,
    enableEvaluatorMultipleConditions,
    nodeValidationMessages,
    updateNodeConfig,
  } = useNodeStoreData(nodeId)

  const conditions = useMemo(
    () => (config.conditions as EvaluatorCondition[] | undefined) ?? [],
    [config.conditions]
  )
  const logicalOperator =
    (config.logicalOperator as "and" | "or" | undefined) ?? "and"
  const isCaseSensitiveFromStore = config.caseSensitive === true
  const resultLabel = asText(config.label).trim()

  const updateConfig = useCallback(
    <K extends keyof EvaluatorNodeConfig>(
      key: K,
      value: EvaluatorNodeConfig[K]
    ) => {
      // Both kinds declare these keys with these exact types, but a union of
      // literal kinds does not narrow the per-kind update payload on its own.
      updateNodeConfig(nodeId, {
        kind,
        key,
        value,
      } as Parameters<typeof updateNodeConfig>[1])
    },
    [kind, nodeId, updateNodeConfig]
  )

  const resultLabelField = useVariableIdentifierField({
    value: resultLabel,
    allowEmpty: true,
    onCommit: (nextLabel) => updateConfig("label", nextLabel),
  })

  const setConditions = useCallback(
    (next: EvaluatorCondition[]) => updateConfig("conditions", next),
    [updateConfig]
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
    (v: "and" | "or") => updateConfig("logicalOperator", v),
    [updateConfig]
  )

  const visibleConditions = enableEvaluatorMultipleConditions
    ? conditions
    : conditions.slice(0, 1)
  const showDragHandle =
    enableEvaluatorMultipleConditions && visibleConditions.length > 1

  return (
    <NodeShell
      nodeId={nodeId}
      title={label}
      subtitle={`${conditions.length} condition${conditions.length !== 1 ? "s" : ""}`}
      selected={selected}
      outputs={outputs}
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
            isSelected={isCaseSensitiveFromStore}
            className={styles.optionToggle()}
            onChange={(checked) =>
              updateConfig("caseSensitive", checked === true)
            }
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
                    variableTypes={expressionVariableTypes}
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
                      variableTypes={expressionVariableTypes}
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

        {footer}
      </div>
    </NodeShell>
  )
}
