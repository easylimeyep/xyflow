// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ExpressionEditor } from "./expression-editor"

// Real CodeMirror, not the mock the integration suite uses: the point is what
// CodeMirror's own keymap does with Mod+F.
describe("ExpressionEditor Mod+F", () => {
  afterEach(() => {
    cleanup()
  })

  it.each([
    ["Ctrl", { ctrlKey: true }],
    ["Cmd", { metaKey: true }],
  ])(
    "lets %s+F reach the host instead of opening CodeMirror's search",
    (_, modifier) => {
      const onHostKeyDown = vi.fn((event: KeyboardEvent) => event)
      const { container } = render(
        <div onKeyDown={(event) => onHostKeyDown(event.nativeEvent)}>
          <ExpressionEditor
            value="{{ price }}"
            variables={[]}
            onCommit={vi.fn()}
          />
        </div>
      )
      const content = container.querySelector<HTMLElement>(".cm-content")
      expect(content).not.toBeNull()
      content!.focus()

      const event = new KeyboardEvent("keydown", {
        key: "f",
        code: "KeyF",
        keyCode: 70,
        bubbles: true,
        cancelable: true,
        ...modifier,
      })
      content!.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
      expect(onHostKeyDown).toHaveBeenCalledTimes(1)
      expect(container.querySelector(".cm-search")).toBeNull()
    }
  )
})
