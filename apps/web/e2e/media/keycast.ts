/**
 * A KeyCastr-style caption for the recordings: a pill of key caps such as
 * "⇧ Shift + Drag". Scenarios show and hide it explicitly (see
 * Recorder.showKeys), so the wording stays deliberate. Installed as an init
 * script; exposes window.__tourKeycast.
 */
export function installKeycast(): void {
  const FADE_MS = 160

  const mount = () => {
    const pill = document.createElement("div")
    pill.setAttribute("data-recording-keycast", "")
    Object.assign(pill.style, {
      position: "fixed",
      left: "0",
      top: "0",
      zIndex: "2147483645",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      borderRadius: "12px",
      background: "rgb(17 17 17 / 0.86)",
      boxShadow: "0 8px 24px rgb(0 0 0 / 0.25)",
      color: "#fafafa",
      font: "500 15px/1 Inter, ui-sans-serif, system-ui, sans-serif",
      pointerEvents: "none",
      opacity: "0",
      translate: "-50% 6px",
      transition: `opacity ${FADE_MS}ms ease-out, translate ${FADE_MS}ms ease-out`,
    })
    document.body.append(pill)

    const keyCap = (label: string) => {
      const cap = document.createElement("kbd")
      cap.textContent = label
      Object.assign(cap.style, {
        padding: "5px 9px",
        borderRadius: "7px",
        border: "1px solid rgb(255 255 255 / 0.22)",
        borderBottomWidth: "2px",
        background: "rgb(255 255 255 / 0.1)",
        font: "inherit",
      })
      return cap
    }

    const plus = () => {
      const sign = document.createElement("span")
      sign.textContent = "+"
      sign.style.opacity = "0.6"
      return sign
    }

    Object.assign(window, {
      __tourKeycast: {
        show(labels: string[], x: number, y: number) {
          pill.replaceChildren(
            ...labels.flatMap((label, index) =>
              index === 0 ? [keyCap(label)] : [plus(), keyCap(label)]
            )
          )
          pill.style.left = `${x}px`
          pill.style.top = `${y}px`
          pill.style.opacity = "1"
          pill.style.translate = "-50% 0"
        },
        hide() {
          pill.style.opacity = "0"
          pill.style.translate = "-50% 6px"
        },
      },
    })
  }

  if (document.body) {
    mount()
  } else {
    document.addEventListener("DOMContentLoaded", mount, { once: true })
  }
}
