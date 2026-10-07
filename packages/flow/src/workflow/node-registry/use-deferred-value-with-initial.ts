"use client"

import { startTransition, useDeferredValue, useEffect, useState } from "react"

/**
 * `useDeferredValue(value, initialValue)` that also works on React 18.
 *
 * React 19 renders `initialValue` first and swaps in `value` in a background
 * render. React 18 has no second argument and ignores it, so the first render
 * would use `value` straight away. Here the first render returns
 * `initialValue`, and a transition after mount switches to the deferred
 * `value` on both versions.
 */
export function useDeferredValueWithInitial<T>(value: T, initialValue: T): T {
  const [hasMounted, setHasMounted] = useState(false)
  const deferredValue = useDeferredValue(value)

  useEffect(() => {
    startTransition(() => setHasMounted(true))
  }, [])

  return hasMounted ? deferredValue : initialValue
}
