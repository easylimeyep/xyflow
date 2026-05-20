"use client"

import { Button } from "@workspace/ui/components/button"
import { Plus, Trash2Icon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { inlineExpressionNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import type { ExpressionVariableOption } from "../../../types"

interface KeywordExpressionListInputProps {
  value: string[]
  variables: ExpressionVariableOption[]
  isInteractive?: boolean
  onChange: (nextValue: string[]) => void
}

type LiveRowsDraft = {
  baseValue: string[]
  rowsByIndex: Record<number, string>
}

const EMPTY_KEYWORD_ROWS = [""]

export function KeywordExpressionListInput({
  value,
  variables,
  isInteractive = true,
  onChange,
}: KeywordExpressionListInputProps) {
  const styles = inlineExpressionNodeStyles()
  const committedRows = value.length > 0 ? value : EMPTY_KEYWORD_ROWS
  const [liveDraft, setLiveDraft] = useState<LiveRowsDraft | null>(null)

  useEffect(() => {
    setLiveDraft((currentDraft) =>
      currentDraft && !areStringArraysEqual(currentDraft.baseValue, value)
        ? null
        : currentDraft
    )
  }, [value])

  const liveRowsByIndex =
    liveDraft && areStringArraysEqual(liveDraft.baseValue, value)
      ? liveDraft.rowsByIndex
      : null
  const rows = useMemo(
    () =>
      committedRows.map((rowValue, index) => {
        if (
          !liveRowsByIndex ||
          !Object.prototype.hasOwnProperty.call(liveRowsByIndex, index)
        ) {
          return rowValue
        }

        return liveRowsByIndex[index] ?? rowValue
      }),
    [committedRows, liveRowsByIndex]
  )

  const rowErrors = useMemo(
    () => rows.map(getKeywordTokenValidationError),
    [rows]
  )
  const hasRowErrors = rowErrors.some(Boolean)

  const setLiveRow = (index: number, nextRowValue: string) => {
    setLiveDraft((currentDraft) => {
      const rowsByIndex =
        currentDraft && areStringArraysEqual(currentDraft.baseValue, value)
          ? currentDraft.rowsByIndex
          : {}

      return {
        baseValue: value,
        rowsByIndex: {
          ...rowsByIndex,
          [index]: nextRowValue,
        },
      }
    })
  }

  const updateRow = (index: number, nextRowValue: string) => {
    setLiveRow(index, nextRowValue)
    if (getKeywordTokenValidationError(nextRowValue)) {
      return
    }

    if (value.length === 0) {
      onChange(nextRowValue === "" ? [] : [nextRowValue])
      return
    }

    const nextValue = value.map((rowValue, rowIndex) =>
      rowIndex === index ? nextRowValue : rowValue
    )
    onChange(nextValue)
  }

  const addRow = () => {
    if (hasRowErrors) {
      return
    }

    onChange([...rows, ""])
  }

  const removeRow = (index: number) => {
    if (hasRowErrors) {
      return
    }

    if (rows.length <= 1) {
      onChange([])
      return
    }

    onChange(rows.filter((_, rowIndex) => rowIndex !== index))
  }

  return (
    <div className={styles.tokenList()}>
      {rows.map((rowValue, index) => {
        const canDelete = isInteractive && value.length > 0
        const committedRowValue = committedRows[index] ?? ""

        return (
          <div
            key={index}
            className={styles.tokenRow()}
            data-testid="keyword-token-row"
          >
            {canDelete ? (
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                className={styles.tokenDeleteButton()}
                aria-label={`Delete token ${index + 1}`}
                data-testid="keyword-token-row-delete"
                onClick={() => removeRow(index)}
              >
                <Trash2Icon />
              </Button>
            ) : null}

            <div className={styles.tokenRowInput()}>
              <ExpressionInput
                value={committedRowValue}
                placeholder="token"
                variables={variables}
                onChange={(nextValue) => updateRow(index, nextValue)}
                onLiveChange={(nextValue) => {
                  setLiveRow(index, nextValue)
                }}
              />
              {rowErrors[index] ? (
                <p className={styles.tokenRowError()}>{rowErrors[index]}</p>
              ) : null}
            </div>
          </div>
        )
      })}

      <div className={styles.tokenAddRow()} data-testid="keyword-token-add-row">
        <Button
          type="button"
          variant="outline"
          className={styles.tokenAddButton()}
          aria-label="Add token"
          size="xs"
          onClick={addRow}
        >
          <Plus data-icon="inline-start" />
          Add token
        </Button>
      </div>
    </div>
  )
}

function getKeywordTokenValidationError(value: string): string | null {
  if (value === "") {
    return null
  }

  const trimmedValue = value.trim()
  const isSingleExpressionToken =
    trimmedValue.startsWith("{{") &&
    trimmedValue.endsWith("}}") &&
    value === trimmedValue

  if (isSingleExpressionToken) {
    return null
  }

  if (/\s/.test(value)) {
    return "Tokens cannot contain spaces. Use one token or one variable per row."
  }

  return null
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  )
}
