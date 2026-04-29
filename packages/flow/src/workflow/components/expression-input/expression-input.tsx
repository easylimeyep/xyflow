"use client"

import {
  ExpressionEditor,
  type ExpressionVariableOption,
} from "@workspace/expression-editor"

interface ExpressionInputProps {
  value: string
  placeholder?: string
  variables: ExpressionVariableOption[]
  onChange: (nextValue: string) => void
}

export function ExpressionInput({
  value,
  placeholder,
  variables,
  onChange,
}: ExpressionInputProps) {
  return (
    <ExpressionEditor
      value={value}
      placeholder={placeholder}
      variables={variables}
      onCommit={(nextValue) => onChange(nextValue)}
    />
  )
}
