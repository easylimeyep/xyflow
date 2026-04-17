"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Plus, X } from "lucide-react"
import { useMemo } from "react"

import { inlineExpressionNodeStyles } from "../../../../styles/components/nodes"
import { ExpressionInput } from "../../../components/expression-input"
import type { ExpressionVariableOption } from "../../../types"

interface KeywordExpressionListInputProps {
  value: string[]
  variables: ExpressionVariableOption[]
  onChange: (nextValue: string[]) => void
}

export function KeywordExpressionListInput({
  value,
  variables,
  onChange,
}: KeywordExpressionListInputProps) {
  const styles = inlineExpressionNodeStyles()
  const rows = useMemo(() => (value.length > 0 ? value : [""]), [value])

  const updateRow = (index: number, nextRowValue: string) => {
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
        const canDelete = value.length > 0

        return (
          <div key={`${index}-${rowValue}`} className={styles.tokenRow()}>
            {canDelete ? (
              <Badge variant="outline" className={styles.tokenDeleteBadge()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className={styles.tokenDeleteButton()}
                  aria-label={`Delete token ${index + 1}`}
                  onClick={() => removeRow(index)}
                >
                  <X />
                </Button>
              </Badge>
            ) : null}

            <div className={styles.tokenRowMain()}>
              <div className={styles.tokenRowInput()}>
                <ExpressionInput
                  value={rowValue}
                  placeholder="{{ myVariable }}"
                  variables={variables}
                  onChange={(nextValue) => updateRow(index, nextValue)}
                />
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
