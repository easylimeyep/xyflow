export type HistoryHotkeyAction = "undo" | "redo"
export type ClipboardHotkeyAction = "copy" | "paste"
export type NodeEditHotkeyAction = "duplicate" | "delete"
export type GroupHotkeyAction = "group" | "ungroup"

const LATIN_LETTER = /^[a-z]$/

/**
 * Whether the event is the given Latin letter key. A Latin `key` wins, so
 * layouts like Dvorak keep their own letters. On non-Latin layouts (Russian)
 * `key` is another script's letter, so the physical key in `code` decides —
 * the same key the browser's own shortcuts answer to there.
 */
function isLetterHotkey(event: KeyboardEvent, letter: string): boolean {
  const key = event.key.toLowerCase()
  if (LATIN_LETTER.test(key)) {
    return key === letter
  }

  return event.code === `Key${letter.toUpperCase()}`
}

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

  if (isLetterHotkey(event, "y")) {
    return "redo"
  }

  if (isLetterHotkey(event, "z")) {
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

  if (isLetterHotkey(event, "c")) {
    return "copy"
  }

  if (isLetterHotkey(event, "v")) {
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

  const hasModifier = event.metaKey || event.ctrlKey

  if (hasModifier && isLetterHotkey(event, "d")) {
    return "duplicate"
  }

  const key = event.key.toLowerCase()
  if (!hasModifier && (key === "backspace" || key === "delete")) {
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

/**
 * `Mod+G` groups the selection, `Mod+Shift+G` ungroups the selected group.
 * The physical key decides on non-Latin layouts, as for every letter hotkey.
 */
export function getGroupHotkeyAction(
  event: KeyboardEvent
): GroupHotkeyAction | null {
  if (event.defaultPrevented || event.altKey) {
    return null
  }

  const hasModifier = event.metaKey || event.ctrlKey
  if (!hasModifier || isEditableEventTarget(event.target)) {
    return null
  }

  if (!isLetterHotkey(event, "g")) {
    return null
  }

  return event.shiftKey ? "ungroup" : "group"
}

/**
 * Runs the group hotkeys. The browser's own `Mod+G` (find next) never runs on
 * the editor, even when the command does not apply to the selection.
 */
export function createGroupHotkeyHandler(
  onGroup: () => void,
  onUngroup: () => void
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    const action = getGroupHotkeyAction(event)
    if (!action) {
      return
    }

    event.preventDefault()
    if (action === "group") {
      onGroup()
      return
    }

    onUngroup()
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

  return isLetterHotkey(event, "f")
}

/** Marks the search bar's own query input; its selection never seeds the query. */
const SEARCH_INPUT_SELECTOR = "[data-workflow-search-input]"

const LINE_BREAK = /[\r\n]/

/** The text selected in `element`, or `""` when it holds no selection. */
function readSelectedText(element: Element): string {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    const { selectionStart, selectionEnd, value } = element
    // Inputs without a text selection API (number, checkbox, ...) report null.
    return selectionStart == null || selectionEnd == null
      ? ""
      : value.slice(selectionStart, selectionEnd)
  }

  // A content-editable field such as the expression editor keeps its
  // selection in the document; it counts only while it sits inside the field.
  const selection = element.ownerDocument.defaultView?.getSelection()
  if (
    !selection ||
    selection.rangeCount === 0 ||
    !element.contains(selection.anchorNode) ||
    !element.contains(selection.focusNode)
  ) {
    return ""
  }
  return selection.toString()
}

/**
 * The query `Mod+F` seeds the search with: the text selected in the focused
 * element inside `root`, taken as is. Returns `null` when there is nothing to
 * seed: no selection, only whitespace, several lines, or a selection inside
 * the search bar's own input.
 */
export function readSearchSeed(
  activeElement: Element | null,
  root: Element
): string | null {
  if (
    !activeElement ||
    !root.contains(activeElement) ||
    activeElement.closest(SEARCH_INPUT_SELECTOR)
  ) {
    return null
  }

  const text = readSelectedText(activeElement)
  return text.trim() === "" || LINE_BREAK.test(text) ? null : text
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
