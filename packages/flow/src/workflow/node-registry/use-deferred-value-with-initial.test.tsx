// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useDeferredValueWithInitial } from "./use-deferred-value-with-initial"

describe("useDeferredValueWithInitial", () => {
  it("returns the initial value on the first render, then the real value", async () => {
    const seen: boolean[] = []

    const { result } = renderHook(() => {
      const value = useDeferredValueWithInitial(false, true)
      seen.push(value)
      return value
    })

    await act(async () => {})

    expect(seen[0]).toBe(true)
    expect(result.current).toBe(false)
  })

  it("follows later changes of the value", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDeferredValueWithInitial(value, true),
      { initialProps: { value: false } }
    )
    await act(async () => {})

    rerender({ value: true })
    await act(async () => {})

    expect(result.current).toBe(true)
  })
})
