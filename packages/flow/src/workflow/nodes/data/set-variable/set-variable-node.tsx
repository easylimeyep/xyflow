"use client"

import type { NodeProps } from "@xyflow/react"
import { Input } from "@workspace/ui/components/input"
import { useCallback, useRef, useState } from "react"

import { setVariableNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { isValidJsIdentifier } from "../../../expression/variable-name/variable-name"
import { NodeShell } from "../../node-shell/node-shell"
import { asText, useBaseNodeData } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"

export function SetVariableNode({ id, data, selected }: NodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Setter"
  const { expressionVariables, updateNodeConfig, updateNodeLabel } = useNodeStoreData(id)

  const valueExpressionFromStore = asText(config.valueExpression)

  const [draftLabel, setDraftLabel] = useState(label)
  const [isLabelFocused, setIsLabelFocused] = useState(false)
  const [labelError, setLabelError] = useState<string | null>(null)
  const labelInputRef = useRef<HTMLInputElement | null>(null)
  const styles = setVariableNodeStyles()

  const shownLabel = isLabelFocused ? draftLabel : label

  const commitLabel = useCallback((): boolean => {
    const nextName = draftLabel.trim()
    if (!nextName) {
      setLabelError("Variable name cannot be empty.")
      return false
    }

    if (!isValidJsIdentifier(nextName)) {
      setLabelError("Variable name must be a valid JavaScript identifier.")
      return false
    }

    setLabelError(null)
    updateNodeLabel(id, nextName)
    return true
  }, [draftLabel, id, updateNodeLabel])

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle="Create variable for downstream expressions"
      selected={selected}
    >
      <div className={styles.root()}>
        <div className={styles.fieldGroup()}>
          <label className={styles.label()}>Variable name</label>
          <Input
            ref={labelInputRef}
            value={shownLabel}
            placeholder="myVar"
            onFocus={() => {
              setDraftLabel(label)
              setIsLabelFocused(true)
            }}
            onChange={(event) => {
              setDraftLabel(event.target.value)
              if (labelError) setLabelError(null)
            }}
            onBlur={() => {
              if (commitLabel()) {
                setIsLabelFocused(false)
                return
              }
              window.requestAnimationFrame(() => {
                labelInputRef.current?.focus()
              })
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              event.preventDefault()
              if (commitLabel()) {
                setIsLabelFocused(false)
                event.currentTarget.blur()
              }
            }}
          />
          {labelError ? <p className={styles.errorText()}>{labelError}</p> : null}
        </div>

        <div className={styles.inlineEditField()}>
          <label className={styles.label()}>
            Value expression
          </label>
          <ExpressionInput
            value={valueExpressionFromStore}
            placeholder="{{ myVariable }}"
            variables={expressionVariables}
            onChange={(nextValue) => {
              updateNodeConfig(id, {
                kind: "setVariable",
                key: "valueExpression",
                value: nextValue,
              })
            }}
          />
        </div>
      </div>
    </NodeShell>
  )
}
