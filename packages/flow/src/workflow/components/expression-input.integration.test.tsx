// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type { ExpressionVariableOption } from "../types"
import { ExpressionInput } from "./expression-input"

vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (nextValue: string) => void
  }) => (
    <textarea
      aria-label="expression-editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

describe("ExpressionInput integration", () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }

    globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it("inserts selected variable in {{ ... }} format", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const variables: ExpressionVariableOption[] = [
      {
        value: '$node("trigger-a").item.json.eventName',
        label: '$node("trigger-a").item.json.eventName',
        description: "Trigger event",
        group: "Upstream: TriggerA",
      },
    ]

    render(
      <ExpressionInput
        value="prefix "
        variables={variables}
        onChange={onChange}
        placeholder="type..."
      />
    )

    await user.click(screen.getByRole("button", { name: "Insert variable" }))
    await user.click(screen.getByText('$node("trigger-a").item.json.eventName'))

    expect(onChange).toHaveBeenCalledWith(
      expect.stringContaining('{{ $node("trigger-a").item.json.eventName }}')
    )
  })
})
