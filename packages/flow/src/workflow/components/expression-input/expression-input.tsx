"use client"

import {
  ExpressionEditor,
  type ExpressionVariableOption,
} from "@flow/expression-editor"

import { searchFieldStyles } from "../../../styles/components/nodes"
import type { FieldSearchStatus } from "../../store"

interface ExpressionInputProps {
  value: string
  placeholder?: string
  variables: ExpressionVariableOption[]
  onChange: (nextValue: string) => void
  onLiveChange?: (nextValue: string) => void
  /** This field's place in the canvas search; unmarked when omitted. */
  searchState?: FieldSearchStatus
}

export function ExpressionInput({
  value,
  placeholder,
  variables,
  onChange,
  onLiveChange,
  searchState = "none",
}: ExpressionInputProps) {
  // Always wrapped, whatever the state: toggling a wrapper in and out would
  // remount the editor and drop focus the moment a search marks it.
  return (
    <div
      className={searchFieldStyles({ searchState })}
      data-field-search-state={searchState === "none" ? undefined : searchState}
    >
      <ExpressionEditor
        value={value}
        placeholder={placeholder}
        variables={variables}
        onCommit={(nextValue) => onChange(nextValue)}
        onLiveChange={onLiveChange}
      />
    </div>
  )
}
