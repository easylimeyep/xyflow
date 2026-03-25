// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import type { ExpressionVariableOption } from "../types"
import { ExpressionInput } from "./expression-input"

vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (nextValue: string, viewUpdate: { state: { selection: { main: { head: number } } } }) => void
  }) => (
    <textarea
      aria-label="expression-editor"
      value={value}
      onChange={(event) =>
        onChange(event.target.value, {
          state: {
            selection: {
              main: {
                head: event.target.selectionStart ?? event.target.value.length,
              },
            },
          },
        })
      }
    />
  ),
}))

describe("ExpressionInput integration", () => {
  afterEach(() => {
    cleanup()
  })

  beforeAll(() => {
    class ResizeObserverMock {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }

    globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  function ControlledExpressionInput({
    initialValue,
    variables,
    onValueChange,
  }: {
    initialValue: string
    variables: ExpressionVariableOption[]
    onValueChange?: (nextValue: string) => void
  }) {
    const [value, setValue] = useState(initialValue)

    return (
      <ExpressionInput
        value={value}
        variables={variables}
        onChange={(nextValue) => {
          setValue(nextValue)
          onValueChange?.(nextValue)
        }}
        placeholder="type..."
      />
    )
  }

  it("inserts selected variable in {{ ... }} format after typing trigger", async () => {
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
      <ControlledExpressionInput initialValue="prefix " variables={variables} onValueChange={onChange} />
    )

    const editor = screen.getByLabelText("expression-editor")
    fireEvent.change(editor, {
      target: {
        value: "prefix {{",
        selectionStart: "prefix {{".length,
      },
    })
    await user.click(screen.getByText('$node("trigger-a").item.json.eventName'))

    expect(onChange).toHaveBeenLastCalledWith('prefix {{ $node("trigger-a").item.json.eventName }}')
  })

  it("replaces {{}} placeholder without leaving extra braces", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const variables: ExpressionVariableOption[] = [
      {
        value: "$input.item.json",
        label: "$input.item.json",
        description: "Current input JSON",
        group: "Execution",
      },
    ]

    render(
      <ControlledExpressionInput initialValue="" variables={variables} onValueChange={onChange} />
    )

    const editor = screen.getByLabelText("expression-editor")
    fireEvent.change(editor, {
      target: {
        value: "{{}}",
        selectionStart: 2,
      },
    })
    await user.click(screen.getByText("$input.item.json"))

    expect(onChange).toHaveBeenLastCalledWith("{{ $input.item.json }}")
  })

  it("replaces trailing {{}} placeholder even when cursor is stale", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const variables: ExpressionVariableOption[] = [
      {
        value: "$input.item.json",
        label: "$input.item.json",
        description: "Current input JSON",
        group: "Execution",
      },
    ]

    render(
      <ControlledExpressionInput initialValue="" variables={variables} onValueChange={onChange} />
    )

    const editor = screen.getByLabelText("expression-editor")
    fireEvent.change(editor, {
      target: {
        value: "{{",
        selectionStart: 2,
      },
    })
    fireEvent.change(editor, {
      target: {
        value: "{{}}",
        selectionStart: 0,
      },
    })
    await user.click(screen.getByText("$input.item.json"))

    expect(onChange).toHaveBeenLastCalledWith("{{ $input.item.json }}")
  })
})
