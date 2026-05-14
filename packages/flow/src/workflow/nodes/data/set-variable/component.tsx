"use client"

import type { NodeProps } from "@xyflow/react"
import { Input } from "@workspace/ui/components/input"

import { setVariableNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { isValidJsIdentifier } from "../../../expression/variable-name/variable-name"
import { NodeShell } from "../../node-shell/node-shell"
import { asText, useBaseNodeData, useVariableIdentifierField } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"

export function SetVariableNode({ id, data, selected }: NodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Setter"
  const { expressionVariables, nodeValidationMessages, updateNodeConfig } =
    useNodeStoreData(id)

  const valueExpressionFromStore = asText(config.valueExpression)
  const variableNameFromConfig = asText(config.variableName).trim()
  const fallbackVariableName = isValidJsIdentifier(label) ? label : "myVar"
  const variableName = variableNameFromConfig || fallbackVariableName

  const styles = setVariableNodeStyles()
  const variableLabelField = useVariableIdentifierField({
    value: variableName,
    onCommit: (nextName) => {
      updateNodeConfig(id, {
        kind: "setVariable",
        key: "variableName",
        value: nextName,
      })
    },
  })

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle="Create variable for downstream expressions"
      selected={selected}
      validationMessages={nodeValidationMessages}
    >
      <div className={styles.root()}>
        <div className={styles.fieldGroup()}>
          <label className={styles.label()}>Label</label>
          <Input
            ref={variableLabelField.inputRef}
            value={variableLabelField.shownValue}
            placeholder="myVar"
            onFocus={variableLabelField.onFocus}
            onChange={(event) => variableLabelField.onChange(event.target.value)}
            onBlur={variableLabelField.onBlur}
            onKeyDown={variableLabelField.onKeyDown}
          />
          {variableLabelField.errorText ? (
            <p className={styles.errorText()}>{variableLabelField.errorText}</p>
          ) : null}
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
