"use client"

import type { NodeProps } from "@xyflow/react"

import { setVariableNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { NodeShell } from "../../node-shell/node-shell"
import { asText, useBaseNodeData } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"

export function SetVariableNode({ id, data, selected }: NodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Concatenate"
  const { expressionVariables, updateNodeConfig } = useNodeStoreData(id)

  const valueExpressionFromStore = asText(config.valueExpression)
  const styles = setVariableNodeStyles()

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle="Create variable for downstream expressions"
      selected={selected}
    >
      <div className={styles.root()}>
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
