// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest"

import {
  getClipboardHotkeyAction,
  getGroupHotkeyAction,
  getHistoryHotkeyAction,
  getNodeEditHotkeyAction,
  isEditableEventTarget,
  isEscapeHotkey,
  isInteractiveEventTarget,
  isSearchHotkey,
  readSearchSeed,
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

  it("returns delete for the Delete key", () => {
    const event = createKeyboardEvent("keydown", {
      key: "Delete",
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

describe("getGroupHotkeyAction", () => {
  it.each([
    ["ctrl+g", { key: "g", ctrlKey: true }, "group"],
    ["cmd+g", { key: "g", metaKey: true }, "group"],
    ["ctrl+shift+g", { key: "G", ctrlKey: true, shiftKey: true }, "ungroup"],
    ["cmd+shift+g", { key: "G", metaKey: true, shiftKey: true }, "ungroup"],
  ] as const)("maps %s to %s", (_, init, action) => {
    expect(getGroupHotkeyAction(createKeyboardEvent("keydown", init))).toBe(
      action
    )
  })

  it.each([
    ["g without a modifier", { key: "g" }],
    ["ctrl+alt+g", { key: "g", ctrlKey: true, altKey: true }],
    ["ctrl+h", { key: "h", ctrlKey: true }],
  ] as const)("ignores %s", (_, init) => {
    expect(
      getGroupHotkeyAction(createKeyboardEvent("keydown", init))
    ).toBeNull()
  })

  it("ignores the shortcut in editable targets", () => {
    const input = document.createElement("input")
    document.body.appendChild(input)
    const event = createKeyboardEvent("keydown", {
      key: "g",
      ctrlKey: true,
      bubbles: true,
    })
    input.dispatchEvent(event)

    expect(getGroupHotkeyAction(event)).toBeNull()
  })
})

describe("letter hotkeys on a non-Latin layout", () => {
  it.each([
    ["cmd+g", "group", { key: "п", code: "KeyG", metaKey: true }],
    [
      "cmd+shift+g",
      "ungroup",
      { key: "П", code: "KeyG", metaKey: true, shiftKey: true },
    ],
  ] as const)("maps %s to %s", (_, action, init) => {
    expect(getGroupHotkeyAction(createKeyboardEvent("keydown", init))).toBe(
      action
    )
  })

  // On the Russian layout the physical C/V/Z/Y/D keys report Cyrillic `key`s.
  it.each([
    ["cmd+c", "copy", { key: "с", code: "KeyC", metaKey: true }],
    ["ctrl+v", "paste", { key: "м", code: "KeyV", ctrlKey: true }],
  ] as const)("maps %s to %s", (_, action, init) => {
    expect(getClipboardHotkeyAction(createKeyboardEvent("keydown", init))).toBe(
      action
    )
  })

  it.each([
    ["cmd+z", "undo", { key: "я", code: "KeyZ", metaKey: true }],
    [
      "cmd+shift+z",
      "redo",
      { key: "Я", code: "KeyZ", metaKey: true, shiftKey: true },
    ],
    ["ctrl+y", "redo", { key: "н", code: "KeyY", ctrlKey: true }],
  ] as const)("maps %s to %s", (_, action, init) => {
    expect(getHistoryHotkeyAction(createKeyboardEvent("keydown", init))).toBe(
      action
    )
  })

  it("maps cmd+d to duplicate", () => {
    const event = createKeyboardEvent("keydown", {
      key: "в",
      code: "KeyD",
      metaKey: true,
    })
    expect(getNodeEditHotkeyAction(event)).toBe("duplicate")
  })

  it("matches cmd+f", () => {
    const event = createKeyboardEvent("keydown", {
      key: "а",
      code: "KeyF",
      metaKey: true,
    })
    expect(isSearchHotkey(event)).toBe(true)
  })

  it("follows the typed Latin letter over the physical key", () => {
    // Dvorak: the physical KeyI types "c", the physical KeyC types "j".
    const copy = createKeyboardEvent("keydown", {
      key: "c",
      code: "KeyI",
      metaKey: true,
    })
    const notCopy = createKeyboardEvent("keydown", {
      key: "j",
      code: "KeyC",
      metaKey: true,
    })
    expect(getClipboardHotkeyAction(copy)).toBe("copy")
    expect(getClipboardHotkeyAction(notCopy)).toBeNull()
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

describe("readSearchSeed", () => {
  function mountRoot(html: string): HTMLElement {
    const root = document.createElement("div")
    root.innerHTML = html
    document.body.append(root)
    return root
  }

  function selectInput(
    root: HTMLElement,
    selector: string,
    start: number,
    end: number
  ): HTMLInputElement | HTMLTextAreaElement {
    const field = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      selector
    )!
    field.focus()
    field.setSelectionRange(start, end)
    return field
  }

  function selectText(node: Node, start: number, end: number) {
    const range = document.createRange()
    range.setStart(node, start)
    range.setEnd(node, end)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
  }

  afterEach(() => {
    window.getSelection()?.removeAllRanges()
  })

  it("reads the selected part of a text input", () => {
    const root = mountRoot('<input value="Calc price" />')
    const input = selectInput(root, "input", 0, 4)
    expect(readSearchSeed(input, root)).toBe("Calc")
  })

  it("reads the selected part of a text area", () => {
    const root = mountRoot("<textarea>total price</textarea>")
    const area = selectInput(root, "textarea", 6, 11)
    expect(readSearchSeed(area, root)).toBe("price")
  })

  it("reads the document selection inside a focused editable region", () => {
    const root = mountRoot(
      '<div contenteditable="true" tabindex="0">{{ price }}</div>'
    )
    const editable = root.querySelector<HTMLElement>("[contenteditable]")!
    editable.focus()
    selectText(editable.firstChild!, 3, 8)
    expect(readSearchSeed(editable, root)).toBe("price")
  })

  it("ignores a document selection outside the focused element", () => {
    const root = mountRoot(
      '<div contenteditable="true" tabindex="0">{{ rate }}</div><p>price</p>'
    )
    const editable = root.querySelector<HTMLElement>("[contenteditable]")!
    editable.focus()
    selectText(root.querySelector("p")!.firstChild!, 0, 5)
    expect(readSearchSeed(editable, root)).toBeNull()
  })

  it("ignores a focused element outside the root", () => {
    const root = mountRoot("<span>editor</span>")
    const outside = mountRoot('<input value="price" />')
    const input = selectInput(outside, "input", 0, 5)
    expect(readSearchSeed(input, root)).toBeNull()
  })

  it("ignores a missing focused element", () => {
    const root = mountRoot("<span>editor</span>")
    expect(readSearchSeed(null, root)).toBeNull()
  })

  it.each([
    ["an empty selection", "price", 2, 2],
    ["a whitespace-only selection", "a   b", 1, 4],
  ])("ignores %s", (_, value, start, end) => {
    const root = mountRoot(`<input value="${value}" />`)
    const input = selectInput(root, "input", start, end)
    expect(readSearchSeed(input, root)).toBeNull()
  })

  it.each([
    ["a line feed", "price\ntotal"],
    ["a carriage return", "price\rtotal"],
  ])("ignores a selection spanning %s", (_, text) => {
    const root = mountRoot("<textarea></textarea>")
    const area = root.querySelector("textarea")!
    area.value = text
    area.focus()
    area.setSelectionRange(0, text.length)
    expect(readSearchSeed(area, root)).toBeNull()
  })

  it("keeps the selected text as is", () => {
    const root = mountRoot('<input value="= {{ price }} " />')
    const input = selectInput(root, "input", 2, 14)
    expect(readSearchSeed(input, root)).toBe("{{ price }} ")
  })

  it("ignores a selection inside the search input itself", () => {
    const root = mountRoot(
      '<input data-workflow-search-input="" value="price total" />'
    )
    const input = selectInput(root, "input", 6, 11)
    expect(readSearchSeed(input, root)).toBeNull()
  })
})
