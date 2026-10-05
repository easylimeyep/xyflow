export type HistoryHotkeyAction = "undo" | "redo"
export type ClipboardHotkeyAction = "copy" | "paste"
export type NodeEditHotkeyAction = "duplicate" | "delete"

export function getHistoryHotkeyAction(
  event: KeyboardEvent
): HistoryHotkeyAction | null {
  if (event.defaultPrevented) {
    return null
  }

  const hasModifier = event.metaKey || event.ctrlKey
  if (!hasModifier) {
    return null
  }

  if (isEditableEventTarget(event.target)) {
    return null
  }

  const key = event.key.toLowerCase()
  if (key === "y") {
    return "redo"
  }

  if (key === "z") {
    return event.shiftKey ? "redo" : "undo"
  }

  return null
}

export function createHistoryHotkeyHandler(
  onUndo: () => void,
  onRedo: () => void
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    const action = getHistoryHotkeyAction(event)
    if (!action) {
      return
    }

    event.preventDefault()
    if (action === "undo") {
      onUndo()
    } else {
      onRedo()
    }
  }
}

export function getClipboardHotkeyAction(
  event: KeyboardEvent
): ClipboardHotkeyAction | null {
  if (event.defaultPrevented) {
    return null
  }

  const hasModifier = event.metaKey || event.ctrlKey
  if (!hasModifier) {
    return null
  }

  if (isEditableEventTarget(event.target)) {
    return null
  }

  const key = event.key.toLowerCase()
  if (key === "c") {
    return "copy"
  }

  if (key === "v") {
    return "paste"
  }

  return null
}

export function createClipboardHotkeyHandler(
  onCopy: () => void,
  onPaste: () => void
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    const action = getClipboardHotkeyAction(event)
    if (!action) {
      return
    }

    event.preventDefault()
    if (action === "copy") {
      onCopy()
      return
    }

    onPaste()
  }
}

export function getNodeEditHotkeyAction(
  event: KeyboardEvent
): NodeEditHotkeyAction | null {
  if (event.defaultPrevented) {
    return null
  }

  if (isEditableEventTarget(event.target)) {
    return null
  }

  const key = event.key.toLowerCase()
  const hasModifier = event.metaKey || event.ctrlKey

  if (hasModifier && key === "d") {
    return "duplicate"
  }

  if (!hasModifier && key === "backspace") {
    return "delete"
  }

  return null
}

export function createNodeEditHotkeyHandler(
  onDuplicate: () => void,
  onDelete: () => void
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    const action = getNodeEditHotkeyAction(event)
    if (!action) {
      return
    }

    event.preventDefault()
    if (action === "duplicate") {
      onDuplicate()
      return
    }

    onDelete()
  }
}

export function isEscapeHotkey(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) {
    return false
  }

  if (isEditableEventTarget(event.target)) {
    return false
  }

  return event.key === "Escape"
}

/**
 * `Mod+F` opens the canvas search. Unlike the editing hotkeys it also fires
 * from inside inputs and expression fields: those are inside the editor too,
 * and the expression editor leaves the key unbound for exactly this reason.
 */
export function isSearchHotkey(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) {
    return false
  }

  const hasModifier = event.metaKey || event.ctrlKey
  if (!hasModifier || event.altKey || event.shiftKey) {
    return false
  }

  // `code` keeps the physical key working on non-Latin layouts, where `key`
  // is another letter but the browser's own find still fires.
  return event.key.toLowerCase() === "f" || event.code === "KeyF"
}

const EDITABLE_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT"])

/**
 * Controls that take a pointer press for themselves. Focusable containers
 * such as React Flow's node wrappers are deliberately not listed: a press on
 * a node body is a canvas interaction, not a control interaction.
 */
const INTERACTIVE_CONTROL_SELECTOR = [
  "button",
  "a[href]",
  "label",
  "summary",
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="gridcell"]',
  '[role="link"]',
  '[role="listbox"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="treeitem"]',
].join(", ")

/**
 * True for text fields, selects, contenteditable regions and the expression
 * editor. The editing hotkeys leave these targets alone so typing keeps its
 * native meaning.
 */
export function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    return true
  }

  // An expression field's preview stands in for its editor until focused.
  if (target.closest(".cm-editor, [data-expression-preview]")) {
    return true
  }

  return EDITABLE_TAG_NAMES.has(target.tagName)
}

/**
 * True when a pointer press on `target` belongs to an editable field or to a
 * control (button, link, menu item, ...) rather than to the canvas around it.
 */
export function isInteractiveEventTarget(target: EventTarget | null): boolean {
  if (isEditableEventTarget(target)) {
    return true
  }

  return (
    target instanceof Element &&
    target.closest(INTERACTIVE_CONTROL_SELECTOR) !== null
  )
}
