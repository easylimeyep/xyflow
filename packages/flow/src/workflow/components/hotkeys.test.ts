// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { getHistoryHotkeyAction } from "./hotkeys"

function createKeyboardEvent(
  type: string,
  init: KeyboardEventInit & { defaultPrevented?: boolean }
): KeyboardEvent {
  const event = new KeyboardEvent(type, init)
  if (init.defaultPrevented) {
    const preventedEvent = new KeyboardEvent(type, { ...init, cancelable: true })
    preventedEvent.preventDefault()
    return preventedEvent
  }
  return event
}

describe("getHistoryHotkeyAction", () => {
  it("returns undo for ctrl+z", () => {
    const event = createKeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      bubbles: true,
    })
    expect(getHistoryHotkeyAction(event)).toBe("undo")
  })

  it("returns redo for ctrl+y and ctrl+shift+z", () => {
    const ctrlY = createKeyboardEvent("keydown", {
      key: "y",
      ctrlKey: true,
      bubbles: true,
    })
    expect(getHistoryHotkeyAction(ctrlY)).toBe("redo")

    const ctrlShiftZ = createKeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    })
    expect(getHistoryHotkeyAction(ctrlShiftZ)).toBe("redo")
  })

  it("ignores hotkeys inside editable elements", () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    const event = createKeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      bubbles: true,
    })
    input.dispatchEvent(event)
    expect(getHistoryHotkeyAction(event)).toBeNull()
  })

  it("ignores hotkeys inside CodeMirror editor", () => {
    const wrapper = document.createElement("div")
    wrapper.className = "cm-editor"
    const inner = document.createElement("div")
    wrapper.appendChild(inner)
    document.body.appendChild(wrapper)
    const event = createKeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      bubbles: true,
    })
    inner.dispatchEvent(event)
    expect(getHistoryHotkeyAction(event)).toBeNull()
  })

  it("ignores already prevented events", () => {
    const event = createKeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      bubbles: true,
      defaultPrevented: true,
    })
    expect(getHistoryHotkeyAction(event)).toBeNull()
  })
})
