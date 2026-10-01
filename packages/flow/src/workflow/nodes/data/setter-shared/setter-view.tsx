"use client"

import type { NodeProps } from "@xyflow/react"
import type { ReactNode } from "react"
import { Checkbox } from "@flow/ui/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@flow/ui/components/field"
import { Input } from "@flow/ui/components/input"

import { setVariableNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { WorkflowTypeSelect } from "../../../components/workflow-type-select/workflow-type-select"
import { NodeShell } from "../../node-shell/node-shell"
import {
  asText,
  useBaseNodeData,
  useVariableIdentifierField,
} from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"

/** The kinds rendered by this view: the Setter and its JSON sibling. */
export type SetterViewKind = "setVariable" | "jsonSetter"

export interface SetterViewProps {
  nodeId: string
  data: NodeProps["data"]
  selected?: boolean
  kind: SetterViewKind
  /** Title shown when the node carries no label of its own. */
  fallbackTitle: string
  /** Extra fields rendered after Clear, in the same group (see JSON Setter). */
  footer?: ReactNode
}

const styles = setVariableNodeStyles()

export function SetterView({
  nodeId,
  data,
  selected,
  kind,
  fallbackTitle,
  footer,
}: SetterViewProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || fallbackTitle
  const { expressionVariables, nodeValidationMessages, updateNodeConfig } =
    useNodeStoreData(nodeId)

  const valueExpressionFromStore = asText(config.valueExpression)
  const variableName = asText(config.variableName).trim()
  const variableTypeFromStore =
    config.variableType === "array" ? "array" : "value"
  const clearFromStore = config.clear === true

  const clearId = `${nodeId}-clear`
  const variableLabelField = useVariableIdentifierField({
    value: variableName,
    onCommit: (nextName) => {
      updateNodeConfig(nodeId, { kind, key: "variableName", value: nextName })
    },
  })

  return (
    <NodeShell
      nodeId={nodeId}
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
            <WorkflowTypeSelect
              ariaLabel="Variable type"
              value={variableTypeFromStore}
              onChange={(value) => {
                updateNodeConfig(nodeId, { kind, key: "variableType", value })
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
              updateNodeConfig(nodeId, {
                kind,
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
                isSelected={clearFromStore}
                onChange={(checked) => {
                  updateNodeConfig(nodeId, {
                    kind,
                    key: "clear",
                    value: checked === true,
                  })
                }}
              />
            </div>
          </Field>
          {footer}
        </FieldGroup>
      </div>
    </NodeShell>
  )
}
