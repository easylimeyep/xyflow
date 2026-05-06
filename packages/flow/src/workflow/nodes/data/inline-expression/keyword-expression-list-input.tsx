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

export function KeywordExpressionListInput({
  value,
  variables,
  isInteractive = true,
  onChange,
}: KeywordExpressionListInputProps) {
  const styles = inlineExpressionNodeStyles()
  const rows = useMemo(() => (value.length > 0 ? value : [""]), [value])
  const [draftRows, setDraftRows] = useState(rows)

  useEffect(() => {
    setDraftRows(rows)
  }, [rows])

  const rowErrors = useMemo(
    () => draftRows.map(getKeywordTokenValidationError),
    [draftRows]
  )

  const updateRow = (index: number, nextRowValue: string) => {
    setDraftRows((currentRows) =>
      currentRows.map((rowValue, rowIndex) =>
        rowIndex === index ? nextRowValue : rowValue
      )
    )

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
    onChange(value.length === 0 ? ["", ""] : [...value, ""])
  }

  const removeRow = (index: number) => {
    if (value.length <= 1) {
      onChange([])
      return
    }

    onChange(value.filter((_, rowIndex) => rowIndex !== index))
  }

  return (
    <div className={styles.tokenList()}>
      {rows.map((rowValue, index) => {
        const canDelete = isInteractive && value.length > 0

        return (
          <div key={index} className={styles.tokenRow()}>
            {canDelete ? (
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                className={styles.tokenDeleteButton()}
                aria-label={`Delete token ${index + 1}`}
                onClick={() => removeRow(index)}
              >
                <Trash2Icon />
              </Button>
            ) : null}

            <div className={styles.tokenRowMain()}>
              <div className={styles.tokenRowInput()}>
                <ExpressionInput
                  value={rowValue}
                  placeholder="{{ myVariable }}"
                  variables={variables}
                  onChange={(nextValue) => updateRow(index, nextValue)}
                  onLiveChange={(nextValue) => {
                    setDraftRows((currentRows) =>
                      currentRows.map((currentRowValue, rowIndex) =>
                        rowIndex === index ? nextValue : currentRowValue
                      )
                    )
                  }}
                />
                {rowErrors[index] ? (
                  <p className={styles.tokenRowError()}>{rowErrors[index]}</p>
                ) : null}
              </div>

              {index === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className={styles.tokenAddButton()}
                  aria-label="Add token"
                  onClick={addRow}
                >
                  <Plus />
                </Button>
              ) : null}
            </div>
          </div>
        )
      })}
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
