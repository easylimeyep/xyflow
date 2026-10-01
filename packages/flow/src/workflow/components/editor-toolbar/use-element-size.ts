"use client"

import { useCallback, useEffect, useState } from "react"

export interface ElementSize {
  width: number
  height: number
}

/**
 * Tracks an element's border-box size. Stays `null` until the first
 * measurement, and for good where `ResizeObserver` is missing (jsdom, SSR),
 * which leaves whatever reads it on its natural size.
 */
export function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null)
  const [size, setSize] = useState<ElementSize | null>(null)

  useEffect(() => {
    if (!element || typeof ResizeObserver === "undefined") {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize?.[0]
      const next = box
        ? { width: box.inlineSize, height: box.blockSize }
        : { width: element.offsetWidth, height: element.offsetHeight }
      setSize((previous) =>
        previous?.width === next.width && previous.height === next.height
          ? previous
          : next
      )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  const ref = useCallback((node: T | null) => setElement(node), [])

  return [ref, size] as const
}
