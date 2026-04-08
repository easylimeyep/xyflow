// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { InlineEditField } from "./inline-edit-field"

function renderField(storeValue: string, onUpdate = vi.fn()) {
  return {
    onUpdate,
    ...render(
      <InlineEditField
        storeValue={storeValue}
        nodeId="node-1"
        configKind="setVariable"
        configKey="valueExpression"
        onUpdate={onUpdate}
      >
        {({ value, onChange }) => (
          <input
            data-testid="field-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </InlineEditField>
    ),
  }
}

describe("InlineEditField", () => {
  afterEach(() => {
    cleanup()
  })

  it("commits new value to onUpdate on blur", () => {
    const { onUpdate } = renderField("{{ $input.item.json }}")
    const input = screen.getByTestId("field-input")

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "hello world" } })
    fireEvent.blur(input)

    expect(onUpdate).toHaveBeenCalledWith("node-1", {
      kind: "setVariable",
      key: "valueExpression",
      value: "hello world",
    })
  })

  it("does not call onUpdate when value is unchanged on blur", () => {
    const { onUpdate } = renderField("{{ $input.item.json }}")
    const input = screen.getByTestId("field-input")

    fireEvent.focus(input)
    fireEvent.blur(input)

    expect(onUpdate).not.toHaveBeenCalled()
  })

  it("commits new value on Enter key", () => {
    const { onUpdate } = renderField("{{ $input.item.json }}")
    const input = screen.getByTestId("field-input")

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "via enter" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(onUpdate).toHaveBeenCalledWith("node-1", {
      kind: "setVariable",
      key: "valueExpression",
      value: "via enter",
    })
  })

  it("does not commit on Shift+Enter", () => {
    const { onUpdate } = renderField("{{ $input.item.json }}")
    const input = screen.getByTestId("field-input")

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "no commit" } })
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true })
    fireEvent.blur(input)

    // Should still commit on blur though
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it("regression: commits value even when onChange fires before React re-renders (stale closure scenario)", () => {
    // This tests the bug where CodeMirror's onChange fires outside React's event system,
    // queuing a state update that hasn't been committed yet when blur fires.
    // Without the draftRef fix, commitDraft would use the stale draft from the last render.
    const onUpdate = vi.fn()
    let capturedOnChange: ((value: string) => void) | null = null

    render(
      <InlineEditField
        storeValue="{{ $input.item.json }}"
        nodeId="node-1"
        configKind="setVariable"
        configKey="valueExpression"
        onUpdate={onUpdate}
      >
        {({ value, onChange }) => {
          capturedOnChange = onChange
          return (
            <input
              data-testid="field-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )
        }}
      </InlineEditField>
    )

    const input = screen.getByTestId("field-input")

    // Focus the field first (React synthetic event - processes immediately)
    fireEvent.focus(input)

    // Simulate CodeMirror onChange firing outside React's event system:
    // call onChange directly without going through a React synthetic event,
    // then immediately fire blur before React re-renders.
    act(() => {
      // Call onChange directly (simulates native CodeMirror callback)
      capturedOnChange!("typed by user")
      // Immediately blur without letting React re-render between the two
      fireEvent.blur(input)
    })

    expect(onUpdate).toHaveBeenCalledWith("node-1", {
      kind: "setVariable",
      key: "valueExpression",
      value: "typed by user",
    })
  })

  it("resets draft to storeValue on each new focus", () => {
    const onUpdate = vi.fn()
    render(
      <InlineEditField
        storeValue="original"
        nodeId="node-1"
        configKind="setVariable"
        configKey="valueExpression"
        onUpdate={onUpdate}
      >
        {({ value, onChange }) => (
          <input
            data-testid="field-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </InlineEditField>
    )

    const input = screen.getByTestId("field-input")

    // First focus/blur cycle: type something but don't commit (shouldn't happen
    // in normal use, but verify focus reset works)
    fireEvent.focus(input)
    expect((input as HTMLInputElement).value).toBe("original")

    fireEvent.change(input, { target: { value: "changed" } })
    expect((input as HTMLInputElement).value).toBe("changed")

    // Blur without committing a different value (blur commits it actually,
    // so let's verify the displayed value after re-focus resets)
    fireEvent.blur(input)

    // Re-focus: draft should reset to storeValue (the prop hasn't changed since
    // onUpdate is mocked and doesn't update the prop)
    fireEvent.focus(input)
    expect((input as HTMLInputElement).value).toBe("original")
  })
})
