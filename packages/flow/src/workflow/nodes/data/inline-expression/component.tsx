"use client"

import type { NodeProps } from "@xyflow/react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"

import { inlineExpressionNodeStyles } from "../../../../styles/components/nodes"
import { NodeShell } from "../../node-shell/node-shell"
import { asStringArray, useBaseNodeData } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"
import { KeywordExpressionListInput } from "./keyword-expression-list-input"

export function InlineExpressionNode({ id, data, selected }: NodeProps) {
  const { label, config } = useBaseNodeData(data)
  const { expressionVariables, updateNodeConfig } = useNodeStoreData(id)
  const templateFromStore = asStringArray(config.template)
  const isRootFromStore = config.isRoot === true
  const isRepeatableFromStore = config.repeatable === true
  const styles = inlineExpressionNodeStyles()

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle="Template with {{ }} references"
      selected={selected}
      showTarget={!isRootFromStore}
      headerAccessory={
        <label className={styles.rootToggleWrap()}>
          <Checkbox
            checked={isRootFromStore}
            className={styles.rootToggle()}
            onCheckedChange={(checked) => {
              updateNodeConfig(id, {
                kind: "inlineExpression",
                key: "isRoot",
                value: checked === true,
              })
            }}
          />
          <span className={styles.rootToggleLabel()}>Root</span>
        </label>
      }
    >
      <div className={styles.editField()}>
        <Label className={styles.label()}>Tokens</Label>
        <KeywordExpressionListInput
          value={templateFromStore}
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
        <label className={styles.rootToggleWrap()}>
          <Checkbox
            checked={isRepeatableFromStore}
            className={styles.rootToggle()}
            onCheckedChange={(checked) => {
              updateNodeConfig(id, {
                kind: "inlineExpression",
                key: "repeatable",
                value: checked === true,
              })
            }}
          />
          <span className={styles.rootToggleLabel()}>Repeatable</span>
        </label>
      </div>
    </NodeShell>
  )
}
