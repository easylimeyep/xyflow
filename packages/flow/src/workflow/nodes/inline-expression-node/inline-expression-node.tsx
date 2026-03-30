"use client"

import type { NodeProps } from "@xyflow/react"
import { useCallback, useRef, useState } from "react"

import { ExpressionInput } from "../../components/expression-input"
import type { ExpressionVariableOption } from "../../types"
import { NodeShell } from "../node-shell/node-shell"
import { OutputQuickAddAffordance } from "../output-quick-add-affordance/output-quick-add-affordance"
import { asRecord, asText, isInsideExpressionPopover } from "../shared/node-data-utils"

export interface InlineExpressionNodeProps extends NodeProps {
  expressionVariables: ExpressionVariableOption[]
  onUpdateConfigField: (nodeId: string, key: string, value: string | number | boolean) => void
}

export function InlineExpressionNode({
  id,
  data,
  selected,
  expressionVariables,
  onUpdateConfigField,
}: InlineExpressionNodeProps) {
  const dataRecord = asRecord(data)
  const label = asText(dataRecord.label)
  const config = asRecord(dataRecord.config)
  const templateFromStore = asText(config.template)

  const [draftTemplate, setDraftTemplate] = useState(templateFromStore)
  const [isFocused, setIsFocused] = useState(false)
  const draftTemplateRef = useRef(draftTemplate)
  const displayedTemplate = isFocused ? draftTemplate : templateFromStore

  const handleTemplateChange = useCallback((nextValue: string) => {
    draftTemplateRef.current = nextValue
    setDraftTemplate(nextValue)
  }, [])

  const commitDraft = useCallback(() => {
    const nextTemplate = draftTemplateRef.current
    if (nextTemplate === templateFromStore) {
      return
    }

    onUpdateConfigField(id, "template", nextTemplate)
  }, [id, templateFromStore, onUpdateConfigField])

  return (
    <div className="relative">
      <NodeShell
        title={label}
        subtitle="Inline expression template"
        selected={selected}
        showSource={false}
      >
        <div
          className="nodrag nopan mt-2"
          onFocusCapture={(event) => {
            const previousTarget = event.relatedTarget
            if (
              previousTarget instanceof HTMLElement &&
              event.currentTarget.contains(previousTarget)
            ) {
              return
            }

            setDraftTemplate(templateFromStore)
            draftTemplateRef.current = templateFromStore
            setIsFocused(true)
          }}
          onBlurCapture={(event) => {
            const nextTarget = event.relatedTarget
            if (
              (nextTarget instanceof HTMLElement && event.currentTarget.contains(nextTarget)) ||
              isInsideExpressionPopover(nextTarget)
            ) {
              return
            }

            commitDraft()
            setIsFocused(false)
          }}
          onKeyDownCapture={(event) => {
            if (event.key !== "Enter" || event.shiftKey) {
              return
            }

            event.preventDefault()
            commitDraft()
            setIsFocused(false)
            if (event.currentTarget instanceof HTMLElement) {
              event.currentTarget.blur()
            }
          }}
        >
          <ExpressionInput
            value={displayedTemplate}
            placeholder='{{ $node("trigger-1").item.json.eventName }}'
            variables={expressionVariables}
            onChange={handleTemplateChange}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Press Enter or blur to commit one history step.
          </p>
        </div>
      </NodeShell>
      <OutputQuickAddAffordance nodeId={id} />
    </div>
  )
}
