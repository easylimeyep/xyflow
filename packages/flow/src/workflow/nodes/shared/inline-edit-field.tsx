"use client"

import { useCallback, useState, type ReactNode } from "react"
import { flushSync } from "react-dom"

import { inlineEditFieldStyles } from "../../../styles/components/nodes"
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
  const displayedValue = isFocused ? draft : storeValue

  const handleChange = useCallback((nextValue: string) => {
    // flushSync forces a synchronous render so that commitDraft's closure
    // always captures the latest draft value, even when blur fires immediately
    // after onChange (React 18 automatic batching would otherwise defer the
    // render, leaving commitDraft with a stale draft).
    flushSync(() => setDraft(nextValue))
  }, [])

  const commitDraft = useCallback(() => {
    const nextValue = draft
    if (nextValue === storeValue) return

    onUpdate(nodeId, { kind: configKind, key: configKey, value: nextValue })
  }, [configKey, configKind, draft, nodeId, onUpdate, storeValue])
  const styles = inlineEditFieldStyles()

  return (
    <div
      className={styles.root({ class: className })}
      onFocusCapture={(event) => {
        const previousTarget = event.relatedTarget
        if (
          previousTarget instanceof HTMLElement &&
          event.currentTarget.contains(previousTarget)
        ) {
          return
        }

        setDraft(storeValue)
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
