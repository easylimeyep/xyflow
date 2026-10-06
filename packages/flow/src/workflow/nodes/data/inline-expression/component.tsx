"use client"

import type { NodeProps } from "@xyflow/react"
import { Checkbox } from "@flow/ui/components/checkbox"
import { Label } from "@flow/ui/components/label"

import { inlineExpressionNodeStyles } from "../../../../styles/components/nodes"
import {
  SearchFieldRegistryProvider,
  SearchMarkedTitle,
  useNodeSearchMarks,
} from "../../../components/workflow-search/search-field-mark"
import { NodeShell } from "../../node-shell/node-shell"
import { asStringArray, useBaseNodeData } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"
import { KeywordExpressionListInput } from "./keyword-expression-list-input"

export function InlineExpressionNode({
  id,
  data,
  selected,
  draggable,
  selectable,
  isConnectable,
}: NodeProps) {
  const { label, config } = useBaseNodeData(data)
  const { expressionVariables, nodeValidationMessages, updateNodeConfig } =
    useNodeStoreData(id)
  const templateFromStore = asStringArray(config.template)
  const isRootFromStore = config.isRoot === true
  const isRepeatableFromStore = config.repeatable === true
  const isCaseSensitiveFromStore = config.caseSensitive === true
  const isInteractive = draggable || selectable || isConnectable
  const styles = inlineExpressionNodeStyles()
  const rootToggleId = `${id}-root`
  const caseSensitiveToggleId = `${id}-case-sensitive`
  const repeatableToggleId = `${id}-repeatable`

  const { fieldRegistry, ...searchMarks } = useNodeSearchMarks(id)
  return (
    <SearchFieldRegistryProvider value={fieldRegistry}>
      <NodeShell
        nodeId={id}
        title={<SearchMarkedTitle nodeId={id}>{label}</SearchMarkedTitle>}
        subtitle="Template with {{ }} references"
        selected={selected}
        {...searchMarks}
        showTarget={!isRootFromStore}
        validationMessages={nodeValidationMessages}
        headerAccessory={
          <div className={styles.rootToggleWrap()}>
            <Checkbox
              id={rootToggleId}
              isSelected={isRootFromStore}
              className={styles.rootToggle()}
              onChange={(checked) => {
                updateNodeConfig(id, {
                  kind: "inlineExpression",
                  key: "isRoot",
                  value: checked === true,
                })
              }}
            />
            <label htmlFor={rootToggleId} className={styles.rootToggleLabel()}>
              Root
            </label>
          </div>
        }
      >
        <div className={styles.editField()}>
          <div className={styles.fieldHeader()}>
            <Label className={styles.label()}>Tokens</Label>
            <div className={styles.rootToggleWrap()}>
              <Checkbox
                id={caseSensitiveToggleId}
                isSelected={isCaseSensitiveFromStore}
                className={styles.rootToggle()}
                onChange={(checked) => {
                  updateNodeConfig(id, {
                    kind: "inlineExpression",
                    key: "caseSensitive",
                    value: checked === true,
                  })
                }}
              />
              <label
                htmlFor={caseSensitiveToggleId}
                className={styles.rootToggleLabel()}
              >
                Case sensitive
              </label>
            </div>
          </div>
          <KeywordExpressionListInput
            nodeId={id}
            value={templateFromStore}
            variables={expressionVariables}
            isInteractive={isInteractive}
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
          <div className={styles.rootToggleWrap()}>
            <Checkbox
              id={repeatableToggleId}
              isSelected={isRepeatableFromStore}
              className={styles.rootToggle()}
              onChange={(checked) => {
                updateNodeConfig(id, {
                  kind: "inlineExpression",
                  key: "repeatable",
                  value: checked === true,
                })
              }}
            />
            <label
              htmlFor={repeatableToggleId}
              className={styles.rootToggleLabel()}
            >
              Repeatable
            </label>
          </div>
        </div>
      </NodeShell>
    </SearchFieldRegistryProvider>
  )
}
