"use client"

import type { NodeProps } from "@xyflow/react"
import { Input } from "@workspace/ui/components/input"
import { useCallback, useRef, useState } from "react"

import { ExpressionInput } from "../../components/expression-input"
import { isValidJsIdentifier } from "../../expression/variable-name/variable-name"
import type { NodeConfigUpdate } from "../../store/types"
import type { ExpressionVariableOption, WorkflowNode } from "../../types"
import { NodeShell } from "../node-shell/node-shell"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"
import { asRecord, asText, isInsideExpressionPopover, useBaseNodeData } from "../shared"

export interface SetVariableNodeProps extends NodeProps {
  expressionVariables: ExpressionVariableOption[]
  onUpdateConfigField: (nodeId: string, update: NodeConfigUpdate) => void
  allNodes: WorkflowNode[]
}

export function SetVariableNode({
  id,
  data,
  selected,
  expressionVariables,
  onUpdateConfigField,
  allNodes,
}: SetVariableNodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Set Variable"
  const variableNameFromStore = asText(config.variableName)
  const valueExpressionFromStore = asText(config.valueExpression)

  const [draftVariableName, setDraftVariableName] = useState(variableNameFromStore)
  const [draftValueExpression, setDraftValueExpression] = useState(valueExpressionFromStore)
  const [isVariableNameFocused, setIsVariableNameFocused] = useState(false)
  const [isValueExpressionFocused, setIsValueExpressionFocused] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const variableInputRef = useRef<HTMLInputElement | null>(null)
  const draftValueExpressionRef = useRef(draftValueExpression)

  const shownVariableName = isVariableNameFocused ? draftVariableName : variableNameFromStore
  const shownValueExpression = isValueExpressionFocused
    ? draftValueExpression
    : valueExpressionFromStore

  const commitVariableName = useCallback((): boolean => {
    const nextName = draftVariableName.trim()
    if (nextName === variableNameFromStore) {
      setNameError(null)
      return true
    }

    if (!isValidJsIdentifier(nextName)) {
      setNameError("Variable name must be a valid JavaScript identifier.")
      return false
    }

    const duplicateNode = allNodes.find((node) => {
      if (node.id === id || node.data.kind !== "setVariable") {
        return false
      }

      const nodeConfig = asRecord(node.data.config)
      return asText(nodeConfig.variableName) === nextName
    })
    if (duplicateNode) {
      setNameError("Variable name must be unique in this workflow.")
      return false
    }

    setNameError(null)
    onUpdateConfigField(id, {
      kind: "setVariable",
      key: "variableName",
      value: nextName,
    })
    return true
  }, [draftVariableName, id, allNodes, onUpdateConfigField, variableNameFromStore])

  const commitValueExpression = useCallback(() => {
    const nextExpression = draftValueExpressionRef.current
    if (nextExpression === valueExpressionFromStore) {
      return
    }

    onUpdateConfigField(id, {
      kind: "setVariable",
      key: "valueExpression",
      value: nextExpression,
    })
  }, [id, onUpdateConfigField, valueExpressionFromStore])

  const handleValueExpressionChange = useCallback((nextValue: string) => {
    draftValueExpressionRef.current = nextValue
    setDraftValueExpression(nextValue)
  }, [])

  return (
    <div className="relative">
      <NodeShell
        title={label}
        subtitle="Create variable for downstream expressions"
        selected={selected}
        showSource={false}
      >
        <div className="nodrag nopan mt-2 space-y-2">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Variable name</label>
            <Input
              ref={variableInputRef}
              value={shownVariableName}
              placeholder="myVar"
              onFocus={() => {
                setDraftVariableName(variableNameFromStore)
                setIsVariableNameFocused(true)
              }}
              onChange={(event) => {
                setDraftVariableName(event.target.value)
                if (nameError) {
                  setNameError(null)
                }
              }}
              onBlur={() => {
                if (commitVariableName()) {
                  setIsVariableNameFocused(false)
                  return
                }

                window.requestAnimationFrame(() => {
                  variableInputRef.current?.focus()
                })
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return
                }
                event.preventDefault()
                if (commitVariableName()) {
                  setIsVariableNameFocused(false)
                  event.currentTarget.blur()
                }
              }}
            />
            {nameError ? <p className="text-[11px] text-destructive">{nameError}</p> : null}
          </div>

          <div
            className="space-y-1"
            onFocusCapture={(event) => {
              const previousTarget = event.relatedTarget
              if (
                previousTarget instanceof HTMLElement &&
                event.currentTarget.contains(previousTarget)
              ) {
                return
              }

              setDraftValueExpression(valueExpressionFromStore)
              draftValueExpressionRef.current = valueExpressionFromStore
              setIsValueExpressionFocused(true)
            }}
            onBlurCapture={(event) => {
              const nextTarget = event.relatedTarget
              if (
                (nextTarget instanceof HTMLElement && event.currentTarget.contains(nextTarget)) ||
                isInsideExpressionPopover(nextTarget)
              ) {
                return
              }

              commitValueExpression()
              setIsValueExpressionFocused(false)
            }}
            onKeyDownCapture={(event) => {
              if (event.key !== "Enter" || event.shiftKey) {
                return
              }

              event.preventDefault()
              commitValueExpression()
              setIsValueExpressionFocused(false)
              if (event.currentTarget instanceof HTMLElement) {
                event.currentTarget.blur()
              }
            }}
          >
            <label className="text-[11px] font-medium text-muted-foreground">Value expression</label>
            <ExpressionInput
              value={shownValueExpression}
              placeholder='{{ $node("trigger-1").item.json.eventName }}'
              variables={expressionVariables}
              onChange={handleValueExpressionChange}
            />
          </div>
        </div>
      </NodeShell>
      <OutputQuickAddAffordance nodeId={id} />
    </div>
  )
}
