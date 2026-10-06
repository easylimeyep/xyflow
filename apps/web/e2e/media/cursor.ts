/**
 * Playwright videos contain neither the mouse cursor nor the OS-drawn image of
 * a native HTML5 drag. This init script paints both into the page so they end
 * up in the recording: a cursor that follows the pointer, and a copy of the
 * palette's drag preview that rides along with it while a drag is in flight.
 */
export function installRecordingCursor(): void {
  const CURSOR_SIZE = 22
  const PRESSED_SCALE = 0.85

  const mount = () => {
    const cursor = document.createElement("div")
    cursor.setAttribute("data-recording-cursor", "")
    cursor.innerHTML = `<svg width="${CURSOR_SIZE}" height="${CURSOR_SIZE}" viewBox="0 0 24 24"><path d="M4 2l16 10.5-7.2 1.4L9 21z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`
    Object.assign(cursor.style, {
      position: "fixed",
      left: "0",
      top: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
      transformOrigin: "4px 2px",
      transition: "scale 120ms ease-out",
      filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.35))",
    })
    document.body.append(cursor)

    let ghost: HTMLElement | null = null

    const moveTo = (x: number, y: number) => {
      // A drag fires a final event at (0, 0) as it ends; ignore it.
      if (x === 0 && y === 0) {
        return
      }
      cursor.style.translate = `${x - 4}px ${y - 2}px`
      if (ghost) {
        ghost.style.translate = `${x}px ${y}px`
      }
    }

    const press = (isPressed: boolean) => {
      cursor.style.scale = isPressed ? String(PRESSED_SCALE) : "1"
    }

    const dropGhost = () => {
      ghost?.remove()
      ghost = null
      press(false)
    }

    window.addEventListener("mousemove", (e) => moveTo(e.clientX, e.clientY))
    window.addEventListener("mousedown", () => press(true))
    window.addEventListener("mouseup", () => press(false))
    window.addEventListener("dragover", (e) => moveTo(e.clientX, e.clientY))
    window.addEventListener("drop", dropGhost)
    window.addEventListener("dragend", dropGhost)
    // Bubble phase on window runs after React's root listener, so the preview
    // already holds the dragged kind when it is cloned.
    window.addEventListener("dragstart", (e) => {
      const preview = document.querySelector<HTMLElement>(
        "[data-palette-drag-preview]"
      )
      if (!preview) {
        return
      }
      ghost = preview.cloneNode(true) as HTMLElement
      ghost.removeAttribute("data-palette-drag-preview")
      Object.assign(ghost.style, {
        top: "0",
        left: "0",
        zIndex: "2147483646",
        opacity: "0.9",
      })
      document.body.append(ghost)
      press(true)
      moveTo(e.clientX, e.clientY)
    })
  }

  if (document.body) {
    mount()
  } else {
    document.addEventListener("DOMContentLoaded", mount, { once: true })
  }
}
