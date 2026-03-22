export type HistoryHotkeyAction = "undo" | "redo"

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
