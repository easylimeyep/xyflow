"use client"

import type { NodeProps } from "@xyflow/react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

import { setVariableNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { WorkflowTypeNativeSelect } from "../../../components/workflow-type-native-select/workflow-type-native-select"
import { NodeShell } from "../../node-shell/node-shell"
import {
  asText,
  useBaseNodeData,
  useVariableIdentifierField,
} from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"

export function SetVariableNode({ id, data, selected }: NodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Setter"
  const { expressionVariables, nodeValidationMessages, updateNodeConfig } =
    useNodeStoreData(id)

  const valueExpressionFromStore = asText(config.valueExpression)
  const variableName = asText(config.variableName).trim()
  const variableTypeFromStore =
    config.variableType === "array" ? "array" : "value"
  const clearFromStore = config.clear === true

  const styles = setVariableNodeStyles()
  const clearId = `${id}-clear`
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
        <div className={styles.labelTypeRow()}>
          <div className={styles.labelTypeField()}>
            <label className={styles.label()}>Label</label>
            <Input
              ref={variableLabelField.inputRef}
              value={variableLabelField.shownValue}
              placeholder="myVar"
              onFocus={variableLabelField.onFocus}
              onChange={(event) =>
                variableLabelField.onChange(event.target.value)
              }
              onBlur={variableLabelField.onBlur}
              onKeyDown={variableLabelField.onKeyDown}
            />
            {variableLabelField.errorText ? (
              <p className={styles.errorText()}>
                {variableLabelField.errorText}
              </p>
            ) : null}
          </div>

          <div className={styles.labelTypeSelectField()}>
            <label className={styles.label()}>Type</label>
            <WorkflowTypeNativeSelect
              ariaLabel="Variable type"
              value={variableTypeFromStore}
              onChange={(value) => {
                updateNodeConfig(id, {
                  kind: "setVariable",
                  key: "variableType",
                  value,
                })
              }}
            />
          </div>
        </div>

        <div className={styles.inlineEditField()}>
          <label className={styles.label()}>Value expression</label>
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

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={clearId}>Clear</FieldLabel>
            <div>
              <Checkbox
                id={clearId}
                checked={clearFromStore}
                onCheckedChange={(checked) => {
                  updateNodeConfig(id, {
                    kind: "setVariable",
                    key: "clear",
                    value: checked === true,
                  })
                }}
              />
            </div>
          </Field>
        </FieldGroup>
      </div>
    </NodeShell>
  )
}
