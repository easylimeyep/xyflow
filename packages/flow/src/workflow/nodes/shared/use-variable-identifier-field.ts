"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { KeyboardEvent, RefObject } from "react"

import { isValidJsIdentifier } from "../../expression/variable-name/variable-name"

interface UseVariableIdentifierFieldOptions {
  value: string
  onCommit: (nextValue: string) => void
  allowEmpty?: boolean
  emptyErrorText?: string
  invalidErrorText?: string
}

interface UseVariableIdentifierFieldResult {
  shownValue: string
  errorText: string | null
  inputRef: RefObject<HTMLInputElement | null>
  onFocus: () => void
  onChange: (nextValue: string) => void
  onBlur: () => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
}

export function useVariableIdentifierField({
  value,
  onCommit,
  allowEmpty = false,
  emptyErrorText = "Label cannot be empty.",
  invalidErrorText = "Label must be a valid JavaScript identifier.",
}: UseVariableIdentifierFieldOptions): UseVariableIdentifierFieldResult {
  const [draftValue, setDraftValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isFocused) {
      return
    }
    setDraftValue(value)
  }, [isFocused, value])

  const shownValue = isFocused ? draftValue : value

  const commit = useCallback((): boolean => {
    const nextValue = draftValue.trim()
    if (!nextValue) {
      if (allowEmpty) {
        setErrorText(null)
        onCommit("")
        return true
      }
      setErrorText(emptyErrorText)
      return false
    }

    if (!isValidJsIdentifier(nextValue)) {
      setErrorText(invalidErrorText)
      return false
    }

    setErrorText(null)
    onCommit(nextValue)
    return true
  }, [allowEmpty, draftValue, emptyErrorText, invalidErrorText, onCommit])

  const onFocus = useCallback(() => {
    setDraftValue(value)
    setIsFocused(true)
  }, [value])

  const onChange = useCallback((nextValue: string) => {
    setDraftValue(nextValue)
    setErrorText((previous) => (previous ? null : previous))
  }, [])

  const onBlur = useCallback(() => {
    if (commit()) {
      setIsFocused(false)
      return
    }

    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [commit])

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return
      }

      event.preventDefault()
      if (!commit()) {
        return
      }

      setIsFocused(false)
      event.currentTarget.blur()
    },
    [commit]
  )

  return {
    shownValue,
    errorText,
    inputRef,
    onFocus,
    onChange,
    onBlur,
    onKeyDown,
  }
}
