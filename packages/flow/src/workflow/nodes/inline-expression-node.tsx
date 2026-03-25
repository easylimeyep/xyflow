"use client"

import type { NodeProps } from "@xyflow/react"
import { useCallback, useMemo, useRef, useState } from "react"

import { ExpressionInput } from "../components/expression-input"
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

export function InlineExpressionNode({ id, data, selected }: NodeProps) {
  const dataRecord = asRecord(data)
  const label = asText(dataRecord.label)
  const config = asRecord(dataRecord.config)
  const templateFromStore = asText(config.template)
  const updateNodeConfigField = useWorkflowShallowStore(
    (state: WorkflowStoreState) => state.updateNodeConfigField
  )
  const nodes = useWorkflowStore((state: WorkflowStoreState) => state.history.present.nodes)
  const edges = useWorkflowStore((state: WorkflowStoreState) => state.history.present.edges)
  const expressionVariables = useMemo(
    () => buildExpressionVariableCatalog(nodes, edges, id),
    [edges, id, nodes]
  )

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

    updateNodeConfigField(id, "template", nextTemplate)
  }, [id, templateFromStore, updateNodeConfigField])

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
            if (nextTarget instanceof HTMLElement && event.currentTarget.contains(nextTarget)) {
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
