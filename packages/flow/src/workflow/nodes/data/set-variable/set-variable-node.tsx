"use client"

import type { NodeProps } from "@xyflow/react"
import { Input } from "@workspace/ui/components/input"
import { useCallback, useRef, useState } from "react"

import { setVariableNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { isValidJsIdentifier } from "../../../expression/variable-name/variable-name"
import { NodeShell } from "../../node-shell/node-shell"
import { InlineEditField, asRecord, asText, useBaseNodeData } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"

export function SetVariableNode({ id, data, selected }: NodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Set Variable"
  const { expressionVariables, updateNodeConfig, allNodes } = useNodeStoreData(id)

  const variableNameFromStore = asText(config.variableName)
  const valueExpressionFromStore = asText(config.valueExpression)

  const [draftVariableName, setDraftVariableName] = useState(variableNameFromStore)
  const [isVariableNameFocused, setIsVariableNameFocused] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const variableInputRef = useRef<HTMLInputElement | null>(null)
  const styles = setVariableNodeStyles()

  const shownVariableName = isVariableNameFocused ? draftVariableName : variableNameFromStore

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
      if (node.id === id || node.data.kind !== "setVariable") return false
      const nodeConfig = asRecord(node.data.config)
      return asText(nodeConfig.variableName) === nextName
    })
    if (duplicateNode) {
      setNameError("Variable name must be unique in this workflow.")
      return false
    }

    setNameError(null)
    updateNodeConfig(id, {
      kind: "setVariable",
      key: "variableName",
      value: nextName,
    })
    return true
  }, [draftVariableName, id, allNodes, updateNodeConfig, variableNameFromStore])

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
            ref={variableInputRef}
            value={shownVariableName}
            placeholder="myVar"
            onFocus={() => {
              setDraftVariableName(variableNameFromStore)
              setIsVariableNameFocused(true)
            }}
            onChange={(event) => {
              setDraftVariableName(event.target.value)
              if (nameError) setNameError(null)
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
              if (event.key !== "Enter") return
              event.preventDefault()
              if (commitVariableName()) {
                setIsVariableNameFocused(false)
                event.currentTarget.blur()
              }
            }}
          />
          {nameError ? <p className={styles.errorText()}>{nameError}</p> : null}
        </div>

        <InlineEditField
          className={styles.inlineEditField()}
          storeValue={valueExpressionFromStore}
          nodeId={id}
          configKind="setVariable"
          configKey="valueExpression"
          onUpdate={updateNodeConfig}
        >
          {({ value, onChange }) => (
            <>
              <label className={styles.label()}>
                Value expression
              </label>
              <ExpressionInput
                value={value}
                placeholder='{{ $node("Trigger").item.json.eventName }}'
                variables={expressionVariables}
                onChange={onChange}
              />
            </>
          )}
        </InlineEditField>
      </div>
    </NodeShell>
  )
}
