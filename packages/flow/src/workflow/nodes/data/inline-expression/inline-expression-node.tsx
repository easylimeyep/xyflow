"use client"

import type { NodeProps } from "@xyflow/react"

import { inlineExpressionNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { NodeShell } from "../../node-shell/node-shell"
import { InlineEditField, asText, useBaseNodeData } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"

export function InlineExpressionNode({ id, data, selected }: NodeProps) {
  const { label, config } = useBaseNodeData(data)
  const { expressionVariables, updateNodeConfig } = useNodeStoreData(id)
  const templateFromStore = asText(config.template)
  const styles = inlineExpressionNodeStyles()

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle="Inline expression template"
      selected={selected}
    >
      <InlineEditField
        className={styles.editField()}
        storeValue={templateFromStore}
        nodeId={id}
        configKind="inlineExpression"
        configKey="template"
        onUpdate={updateNodeConfig}
      >
        {({ value, onChange }) => (
          <>
            <ExpressionInput
              value={value}
              placeholder='{{ $node("Trigger").item.json.eventName }}'
              variables={expressionVariables}
              onChange={onChange}
            />
            <p className={styles.helperText()}>
              Press Enter or blur to commit one history step.
            </p>
          </>
        )}
      </InlineEditField>
    </NodeShell>
  )
}
