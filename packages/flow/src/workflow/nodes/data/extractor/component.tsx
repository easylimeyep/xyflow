"use client"

import type { NodeProps } from "@xyflow/react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useCallback, useRef, useState } from "react"

import { setVariableNodeStyles } from "../../../../styles/components/nodes"
import { WorkflowTypePicker } from "../../../components/workflow-type-picker/workflow-type-picker"
import { isValidJsIdentifier } from "../../../expression/variable-name/variable-name"
import { NodeShell } from "../../node-shell/node-shell"
import {
  asText,
  useBaseNodeData,
  useVariableIdentifierField,
} from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"

export function ExtractorNode({ id, data, selected }: NodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Extractor"
  const { nodeValidationMessages, updateNodeConfig } = useNodeStoreData(id)

  const variableLabelFromConfig = asText(config.extractExpression).trim()
  const fallbackVariableLabel = isValidJsIdentifier(label) ? label : "myVar"
  const variableLabel = variableLabelFromConfig || fallbackVariableLabel
  const tokenNumberFromStore =
    typeof config.tokenNumber === "number" &&
    Number.isFinite(config.tokenNumber)
      ? Math.max(1, Math.trunc(config.tokenNumber))
      : 1
  const unlimitedFromStore = config.unlimited === true
  const variableTypeFromStore =
    config.variableType === "array" ? "array" : "string"

  const [draftTokenNumber, setDraftTokenNumber] = useState(
    String(tokenNumberFromStore)
  )
  const [isTokenNumberFocused, setIsTokenNumberFocused] = useState(false)
  const [tokenNumberError, setTokenNumberError] = useState<string | null>(null)
  const tokenInputRef = useRef<HTMLInputElement | null>(null)
  const styles = setVariableNodeStyles()
  const unlimitedId = `${id}-unlimited`
  const variableLabelField = useVariableIdentifierField({
    value: variableLabel,
    onCommit: (nextLabel) => {
      updateNodeConfig(id, {
        kind: "extractor",
        key: "extractExpression",
        value: nextLabel,
      })
    },
  })

  const shownTokenNumber = isTokenNumberFocused
    ? draftTokenNumber
    : String(tokenNumberFromStore)

  const commitTokenNumber = useCallback((): boolean => {
    const nextRaw = draftTokenNumber.trim()
    if (!/^\d+$/.test(nextRaw)) {
      setTokenNumberError("Token number must be a non-negative integer.")
      return false
    }

    const nextTokenNumber = Number.parseInt(nextRaw, 10)
    if (!Number.isSafeInteger(nextTokenNumber) || nextTokenNumber < 0) {
      setTokenNumberError("Token number must be a non-negative integer.")
      return false
    }

    if (nextTokenNumber === tokenNumberFromStore) {
      setTokenNumberError(null)
      return true
    }

    setTokenNumberError(null)
    updateNodeConfig(id, {
      kind: "extractor",
      key: "tokenNumber",
      value: nextTokenNumber,
    })
    return true
  }, [draftTokenNumber, id, tokenNumberFromStore, updateNodeConfig])

  return (
    <NodeShell
      nodeId={id}
      title={label}
      subtitle=""
      selected={selected}
      validationMessages={nodeValidationMessages}
    >
      <div className={styles.root()}>
        <div className={styles.labelTypeRow()}>
          <div className={styles.labelTypeField()}>
            <Label className={styles.label()}>Label</Label>
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
            <Label className={styles.label()}>Type</Label>
            <WorkflowTypePicker
              ariaLabel="Variable type"
              value={variableTypeFromStore}
              onChange={(value) => {
                updateNodeConfig(id, {
                  kind: "extractor",
                  key: "variableType",
                  value,
                })
              }}
            />
          </div>
        </div>

        <div className={styles.fieldGroup()}>
          <Label className={styles.label()}>Token Number</Label>
          <Input
            type="number"
            min={1}
            step={1}
            ref={tokenInputRef}
            value={shownTokenNumber}
            placeholder="1"
            onFocus={() => {
              setDraftTokenNumber(String(tokenNumberFromStore))
              setIsTokenNumberFocused(true)
            }}
            onChange={(event) => {
              setDraftTokenNumber(event.target.value)
              if (tokenNumberError) setTokenNumberError(null)
            }}
            onBlur={() => {
              if (commitTokenNumber()) {
                setIsTokenNumberFocused(false)
                return
              }
              window.requestAnimationFrame(() => {
                tokenInputRef.current?.focus()
              })
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              event.preventDefault()
              if (commitTokenNumber()) {
                setIsTokenNumberFocused(false)
                event.currentTarget.blur()
              }
            }}
          />
          {tokenNumberError ? (
            <p className={styles.errorText()}>{tokenNumberError}</p>
          ) : null}
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={unlimitedId}>Unlimited</FieldLabel>
            <div>
              <Checkbox
                id={unlimitedId}
                checked={unlimitedFromStore}
                onCheckedChange={(checked) => {
                  updateNodeConfig(id, {
                    kind: "extractor",
                    key: "unlimited",
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
