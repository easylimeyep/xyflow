"use client"

import { useState, type KeyboardEvent } from "react"

import { Input } from "@flow/ui/components/input"

interface GroupRenameInputProps {
  label: string
  className: string
  /** Called with the trimmed label; never with an empty one. */
  onCommit: (label: string) => void
  onCancel: () => void
}

/**
 * The inline label editor in a group header. Enter or leaving the field
 * commits, Escape cancels; an empty label is never committed, so the group
 * keeps the one it had.
 */
export function GroupRenameInput({
  label,
  className,
  onCommit,
  onCancel,
}: GroupRenameInputProps) {
  const [draft, setDraft] = useState(label)

  const commit = () => {
    const next = draft.trim()
    if (next === "" || next === label) {
      onCancel()
      return
    }
    onCommit(next)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Keep keys such as Backspace and Enter away from the canvas hotkeys.
    event.stopPropagation()
    if (event.key === "Enter") {
      event.preventDefault()
      commit()
    } else if (event.key === "Escape") {
      event.preventDefault()
      onCancel()
    }
  }

  return (
    <Input
      // Focus is the whole point of entering rename mode.
      // eslint-disable-next-line jsx-a11y/no-autofocus -- the user asked for it.
      autoFocus
      aria-label="Group name"
      className={className}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={commit}
      onFocus={(event) => event.currentTarget.select()}
      onPointerDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    />
  )
}
