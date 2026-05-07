export type HistoryHotkeyAction = "undo" | "redo"
export type ClipboardHotkeyAction = "copy" | "paste"
export type NodeEditHotkeyAction = "duplicate" | "delete"

export function getHistoryHotkeyAction(event: KeyboardEvent): HistoryHotkeyAction | null {
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

export function getClipboardHotkeyAction(event: KeyboardEvent): ClipboardHotkeyAction | null {
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

export function getNodeEditHotkeyAction(event: KeyboardEvent): NodeEditHotkeyAction | null {
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

function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  if (target.closest(".cm-editor")) {
    return true
  }

  const tagName = target.tagName
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT"
}
