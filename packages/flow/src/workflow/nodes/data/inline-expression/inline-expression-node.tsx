"use client"

import type { NodeProps } from "@xyflow/react"
import { Label } from "@workspace/ui/components/label"

import { inlineExpressionNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { NodeShell } from "../../node-shell/node-shell"
import { asText, useBaseNodeData } from "../../shared"
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
      subtitle="Template with {{ }} references"
      selected={selected}
    >
      <div className={styles.editField()}>
        <Label className={styles.label()}>Tokens</Label>
        <ExpressionInput
          value={templateFromStore}
          placeholder='{{ $node("Trigger").item.json.eventName }}'
          variables={expressionVariables}
          onChange={(nextValue) => {
            updateNodeConfig(id, {
              kind: "inlineExpression",
              key: "template",
              value: nextValue,
            })
          }}
        />
        <p className={styles.helperText()}>
          Press Enter or blur to commit one history step.
        </p>
      </div>
    </NodeShell>
  )
}
