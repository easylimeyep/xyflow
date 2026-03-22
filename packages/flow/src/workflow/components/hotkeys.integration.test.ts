// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

import { createHistoryHotkeyHandler } from "./hotkeys"

describe("createHistoryHotkeyHandler integration", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("calls undo/redo for global shortcuts on non-editable target", () => {
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    const handler = createHistoryHotkeyHandler(onUndo, onRedo)
    window.addEventListener("keydown", handler)

    const undoEvent = new KeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      bubbles: true,
    })
    window.dispatchEvent(undoEvent)

    const redoEvent = new KeyboardEvent("keydown", {
      key: "y",
      ctrlKey: true,
      bubbles: true,
    })
    window.dispatchEvent(redoEvent)

    window.removeEventListener("keydown", handler)
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).toHaveBeenCalledTimes(1)
  })

  it("does not call undo/redo for events from CodeMirror/input", () => {
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    const handler = createHistoryHotkeyHandler(onUndo, onRedo)
    window.addEventListener("keydown", handler)

    const input = document.createElement("input")
    document.body.appendChild(input)
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        bubbles: true,
      })
    )

    const cm = document.createElement("div")
    cm.className = "cm-editor"
    const cmInner = document.createElement("div")
    cm.appendChild(cmInner)
    document.body.appendChild(cm)
    cmInner.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        bubbles: true,
      })
    )

    window.removeEventListener("keydown", handler)
    expect(onUndo).not.toHaveBeenCalled()
    expect(onRedo).not.toHaveBeenCalled()
  })
})
