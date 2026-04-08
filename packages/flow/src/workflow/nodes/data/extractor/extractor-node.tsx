"use client"

import type { NodeProps } from "@xyflow/react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useCallback, useRef, useState } from "react"

import { setVariableNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import { NodeShell } from "../../node-shell/node-shell"
import { asText, useBaseNodeData } from "../../shared"
import { useNodeStoreData } from "../../shared/use-node-store-data"

export function ExtractorNode({ id, data, selected }: NodeProps) {
  const { label: baseLabel, config } = useBaseNodeData(data)
  const label = baseLabel || "Extractor"
  const { expressionVariables, updateNodeConfig } = useNodeStoreData(id)

  const extractExpressionFromStore = asText(config.extractExpression)
  const tokenNumberFromStore =
    typeof config.tokenNumber === "number" &&
    Number.isFinite(config.tokenNumber)
      ? Math.max(0, Math.trunc(config.tokenNumber))
      : 0
  const unlimitedFromStore = config.unlimited === true

  const [draftTokenNumber, setDraftTokenNumber] = useState(
    String(tokenNumberFromStore)
  )
  const [isTokenNumberFocused, setIsTokenNumberFocused] = useState(false)
  const [tokenNumberError, setTokenNumberError] = useState<string | null>(null)
  const tokenInputRef = useRef<HTMLInputElement | null>(null)
  const styles = setVariableNodeStyles()
  const unlimitedId = `${id}-unlimited`

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
    <NodeShell nodeId={id} title={label} subtitle="" selected={selected}>
      <div className={styles.root()}>
        <div className={styles.fieldGroup()}>
          <Label className={styles.label()}>Token Number</Label>
          <Input
            type="number"
            min={0}
            step={1}
            ref={tokenInputRef}
            value={shownTokenNumber}
            placeholder="0"
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

        <div className={styles.inlineEditField()}>
          <Label className={styles.label()}>Label</Label>
          <ExpressionInput
            value={extractExpressionFromStore}
            placeholder='{{ $node("Trigger").item.json.eventName }}'
            variables={expressionVariables}
            onChange={(nextValue) => {
              updateNodeConfig(id, {
                kind: "extractor",
                key: "extractExpression",
                value: nextValue,
              })
            }}
          />
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
