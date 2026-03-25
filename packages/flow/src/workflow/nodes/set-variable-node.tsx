"use client"

import type { NodeProps } from "@xyflow/react"
import { Input } from "@workspace/ui/components/input"
import { useCallback, useMemo, useRef, useState } from "react"

import { ExpressionInput } from "../components/expression-input"
import { isValidJsIdentifier } from "../expression/variable-name"
import { buildExpressionVariableCatalog } from "../expression/variables"
import {
  useWorkflowShallowStore,
  useWorkflowStore,
  type WorkflowStoreState,
} from "../store"
import { NodeShell } from "./node-shell"
import { OutputQuickAddAffordance } from "./output-quick-add-affordance"

function asText(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function isInsideExpressionPopover(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('[data-slot="popover-content"]'))
}

export function SetVariableNode({ id, data, selected }: NodeProps) {
  const dataRecord = asRecord(data)
  const label = asText(dataRecord.label) || "Set Variable"
  const config = asRecord(dataRecord.config)
  const variableNameFromStore = asText(config.variableName)
  const valueExpressionFromStore = asText(config.valueExpression)

  const updateNodeConfigField = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeConfigField
  )
  const nodes = useWorkflowStore((state: WorkflowStoreState) => state.history.present.nodes)
  const edges = useWorkflowStore((state: WorkflowStoreState) => state.history.present.edges)
  const expressionVariables = useMemo(
    () => buildExpressionVariableCatalog(nodes, edges, id),
    [edges, id, nodes]
  )

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

    const duplicateNode = nodes.find((node) => {
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
    updateNodeConfigField(id, "variableName", nextName)
    return true
  }, [draftVariableName, id, nodes, updateNodeConfigField, variableNameFromStore])

  const commitValueExpression = useCallback(() => {
    const nextExpression = draftValueExpressionRef.current
    if (nextExpression === valueExpressionFromStore) {
      return
    }

    updateNodeConfigField(id, "valueExpression", nextExpression)
  }, [id, updateNodeConfigField, valueExpressionFromStore])

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
