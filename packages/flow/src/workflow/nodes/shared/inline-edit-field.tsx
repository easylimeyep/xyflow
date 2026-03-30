"use client"

import { useCallback, useRef, useState, type ReactNode } from "react"

import { isInsideExpressionPopover } from "./node-data-utils"

interface InlineEditFieldProps {
  storeValue: string
  nodeId: string
  configKind: string
  configKey: string
  onUpdate: (nodeId: string, update: { kind: string; key: string; value: unknown }) => void
  className?: string
  children: (props: { value: string; onChange: (next: string) => void }) => ReactNode
}

export function InlineEditField({
  storeValue,
  nodeId,
  configKind,
  configKey,
  onUpdate,
  className,
  children,
}: InlineEditFieldProps) {
  const [draft, setDraft] = useState(storeValue)
  const [isFocused, setIsFocused] = useState(false)
  const draftRef = useRef(draft)
  const displayedValue = isFocused ? draft : storeValue

  const handleChange = useCallback((nextValue: string) => {
    draftRef.current = nextValue
    setDraft(nextValue)
  }, [])

  const commitDraft = useCallback(() => {
    const nextValue = draftRef.current
    if (nextValue === storeValue) return

    onUpdate(nodeId, { kind: configKind, key: configKey, value: nextValue })
  }, [nodeId, storeValue, onUpdate, configKind, configKey])

  return (
    <div
      className={className}
      onFocusCapture={(event) => {
        const previousTarget = event.relatedTarget
        if (
          previousTarget instanceof HTMLElement &&
          event.currentTarget.contains(previousTarget)
        ) {
          return
        }

        setDraft(storeValue)
        draftRef.current = storeValue
        setIsFocused(true)
      }}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget
        if (
          (nextTarget instanceof HTMLElement && event.currentTarget.contains(nextTarget)) ||
          isInsideExpressionPopover(nextTarget)
        ) {
          return
        }

        commitDraft()
        setIsFocused(false)
      }}
      onKeyDownCapture={(event) => {
        if (event.key !== "Enter" || event.shiftKey) return

        event.preventDefault()
        commitDraft()
        setIsFocused(false)
        if (event.currentTarget instanceof HTMLElement) {
          event.currentTarget.blur()
        }
      }}
    >
      {children({ value: displayedValue, onChange: handleChange })}
    </div>
  )
}
