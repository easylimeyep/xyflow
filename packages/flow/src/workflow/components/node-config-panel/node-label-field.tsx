"use client"

import { type ChangeEvent, type KeyboardEvent, useId, useState } from "react"

import { Input } from "@workspace/ui/components/input"
import { nodeConfigPanelStyles } from "../../../styles/components/panels"

const styles = nodeConfigPanelStyles()

interface NodeLabelFieldProps {
  nodeId: string
  label: string
  onUpdateLabel: (nodeId: string, nextLabel: string) => void
}

export function NodeLabelField({ nodeId, label, onUpdateLabel }: NodeLabelFieldProps) {
  const labelId = useId()
  const [labelDraft, setLabelDraft] = useState("")
  const [isLabelFocused, setIsLabelFocused] = useState(false)
  const displayedLabel = isLabelFocused ? labelDraft : label

  return (
    <div className={styles.fieldGroup()}>
      <label htmlFor={labelId} className={styles.label()}>
        Label
      </label>
      <Input
        id={labelId}
        value={displayedLabel}
        onFocus={() => {
          setLabelDraft(label)
          setIsLabelFocused(true)
        }}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setLabelDraft(event.target.value)
        }}
        onBlur={() => {
          onUpdateLabel(nodeId, labelDraft)
          setIsLabelFocused(false)
        }}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key !== "Enter") return
          event.preventDefault()
          onUpdateLabel(nodeId, labelDraft)
          setIsLabelFocused(false)
          event.currentTarget.blur()
        }}
      />
    </div>
  )
}
