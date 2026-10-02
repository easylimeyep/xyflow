// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest"

import {
  getClipboardHotkeyAction,
  getHistoryHotkeyAction,
  getNodeEditHotkeyAction,
  isEditableEventTarget,
  isEscapeHotkey,
  isInteractiveEventTarget,
  isSearchHotkey,
} from "./hotkeys"

function createKeyboardEvent(
  type: string,
  init: KeyboardEventInit & { defaultPrevented?: boolean }
): KeyboardEvent {
  const event = new KeyboardEvent(type, init)
  if (init.defaultPrevented) {
    const preventedEvent = new KeyboardEvent(type, {
      ...init,
      cancelable: true,
    })
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

describe("isEscapeHotkey", () => {
  it("returns true for escape on non-editable targets", () => {
    const event = createKeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    })

    expect(isEscapeHotkey(event)).toBe(true)
  })

  it("returns false for escape inside editable elements", () => {
    const textarea = document.createElement("textarea")
    document.body.appendChild(textarea)
    const event = createKeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    })
    textarea.dispatchEvent(event)

    expect(isEscapeHotkey(event)).toBe(false)
  })
})

describe("getClipboardHotkeyAction", () => {
  it("returns copy/paste for modified shortcuts", () => {
    const copyEvent = createKeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
      bubbles: true,
    })
    expect(getClipboardHotkeyAction(copyEvent)).toBe("copy")

    const pasteEvent = createKeyboardEvent("keydown", {
      key: "v",
      ctrlKey: true,
      bubbles: true,
    })
    expect(getClipboardHotkeyAction(pasteEvent)).toBe("paste")
  })

  it("ignores clipboard shortcuts in editable targets", () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    const event = createKeyboardEvent("keydown", {
      key: "v",
      ctrlKey: true,
      bubbles: true,
    })
    input.dispatchEvent(event)

    expect(getClipboardHotkeyAction(event)).toBeNull()
  })
})

describe("getNodeEditHotkeyAction", () => {
  it("returns duplicate for ctrl+d", () => {
    const event = createKeyboardEvent("keydown", {
      key: "d",
      ctrlKey: true,
      bubbles: true,
    })

    expect(getNodeEditHotkeyAction(event)).toBe("duplicate")
  })

  it("returns delete for backspace", () => {
    const event = createKeyboardEvent("keydown", {
      key: "Backspace",
      bubbles: true,
    })

    expect(getNodeEditHotkeyAction(event)).toBe("delete")
  })

  it("ignores node edit shortcuts in editable targets", () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    const event = createKeyboardEvent("keydown", {
      key: "Backspace",
      bubbles: true,
    })
    input.dispatchEvent(event)

    expect(getNodeEditHotkeyAction(event)).toBeNull()
  })
})

describe("isSearchHotkey", () => {
  it.each([
    ["ctrl+f", { key: "f", ctrlKey: true }],
    ["cmd+f", { key: "f", metaKey: true }],
    ["cmd+F with caps lock", { key: "F", metaKey: true }],
  ])("matches %s", (_, init) => {
    expect(isSearchHotkey(createKeyboardEvent("keydown", init))).toBe(true)
  })

  it.each([
    ["plain f", { key: "f" }],
    ["ctrl+shift+f", { key: "f", ctrlKey: true, shiftKey: true }],
    ["ctrl+alt+f", { key: "f", ctrlKey: true, altKey: true }],
    ["ctrl+g", { key: "g", ctrlKey: true }],
    [
      "an already handled ctrl+f",
      { key: "f", ctrlKey: true, defaultPrevented: true },
    ],
  ])("ignores %s", (_, init) => {
    expect(isSearchHotkey(createKeyboardEvent("keydown", init))).toBe(false)
  })

  it("fires from inside editable targets", () => {
    const input = document.createElement("input")
    document.body.append(input)
    const event = new KeyboardEvent("keydown", {
      key: "f",
      ctrlKey: true,
      bubbles: true,
    })
    input.dispatchEvent(event)

    expect(isSearchHotkey(event)).toBe(true)
    input.remove()
  })
})

afterEach(() => {
  document.body.innerHTML = ""
})

function mount(html: string, selector: string): Element {
  const host = document.createElement("div")
  host.innerHTML = html
  document.body.append(host)
  const target = host.querySelector(selector)
  if (!target) {
    throw new Error(`No element matches ${selector}`)
  }
  return target
}

describe("isEditableEventTarget", () => {
  it.each([
    ["an input", "<input />", "input"],
    ["a textarea", "<textarea></textarea>", "textarea"],
    ["a select", "<select></select>", "select"],
    [
      "an expression editor line",
      '<div class="cm-editor"><div class="cm-line">x</div></div>',
      ".cm-line",
    ],
    [
      "an expression field's preview",
      '<div data-expression-preview=""><div class="text">x</div></div>',
      ".text",
    ],
  ])("is true for %s", (_, html, selector) => {
    expect(isEditableEventTarget(mount(html, selector))).toBe(true)
  })

  it.each([
    ["a button", "<button>Go</button>", "button"],
    ["a plain div", "<div>node body</div>", "div"],
  ])("is false for %s", (_, html, selector) => {
    expect(isEditableEventTarget(mount(html, selector))).toBe(false)
  })

  it("is false for a missing target", () => {
    expect(isEditableEventTarget(null)).toBe(false)
  })
})

describe("isInteractiveEventTarget", () => {
  it.each([
    ["an input", "<input />", "input"],
    [
      "an expression editor line",
      '<div class="cm-editor"><div class="cm-line">x</div></div>',
      ".cm-line",
    ],
    ["a button", "<button>Go</button>", "button"],
    ["an icon inside a button", "<button><svg></svg></button>", "svg"],
    ["a link", '<a href="#x">Link</a>', "a"],
    ["a role=button element", '<div role="button">Go</div>', "div"],
    [
      "the visual box of a label-wrapped checkbox",
      '<label><input type="checkbox" hidden /><span class="box"></span></label>',
      ".box",
    ],
    ["a menu checkbox item", '<div role="menuitemcheckbox">On</div>', "div"],
  ])("is true for %s", (_, html, selector) => {
    expect(isInteractiveEventTarget(mount(html, selector))).toBe(true)
  })

  it.each([
    ["a plain div", "<div>node body</div>", "div"],
    [
      "a focusable node wrapper",
      '<div tabindex="0"><span>label</span></div>',
      "span",
    ],
  ])("is false for %s", (_, html, selector) => {
    expect(isInteractiveEventTarget(mount(html, selector))).toBe(false)
  })

  it("is false for a missing target", () => {
    expect(isInteractiveEventTarget(null)).toBe(false)
  })
})
