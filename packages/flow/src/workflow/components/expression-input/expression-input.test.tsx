// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ExpressionInput } from "./expression-input"

vi.mock("@flow/expression-editor", () => ({
  ExpressionEditor: () => <div data-testid="editor" />,
}))

function wrapperOf(searchState?: "none" | "match" | "current") {
  const { getByTestId } = render(
    <ExpressionInput
      value=""
      variables={[]}
      onChange={vi.fn()}
      searchState={searchState}
    />
  )
  return getByTestId("editor").parentElement as HTMLElement
}

describe("ExpressionInput search marks", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders no mark by default", () => {
    const wrapper = wrapperOf()

    expect(wrapper.dataset.fieldSearchState).toBeUndefined()
    expect(wrapper.className).not.toContain("ring-")
  })

  it("marks a matching field subtly", () => {
    const wrapper = wrapperOf("match")

    expect(wrapper.dataset.fieldSearchState).toBe("match")
    expect(wrapper.className).toContain("ring-amber-400/70")
  })

  it("marks the current field strongly", () => {
    const wrapper = wrapperOf("current")

    expect(wrapper.dataset.fieldSearchState).toBe("current")
    expect(wrapper.className).toContain("ring-primary")
  })

  it("keeps the same editor element when the mark changes", () => {
    const { getByTestId, rerender } = render(
      <ExpressionInput value="" variables={[]} onChange={vi.fn()} />
    )
    const editor = getByTestId("editor")

    rerender(
      <ExpressionInput
        value=""
        variables={[]}
        onChange={vi.fn()}
        searchState="current"
      />
    )

    expect(getByTestId("editor")).toBe(editor)
  })
})
