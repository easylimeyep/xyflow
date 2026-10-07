// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { Button } from "react-aria-components"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Checkbox } from "./checkbox.js"
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./context-menu.js"

afterEach(() => {
  cleanup()
})

function renderTarget(onOpenChange = vi.fn()) {
  render(
    <ContextMenuTrigger
      onOpenChange={onOpenChange}
      menu={
        <ContextMenu aria-label="Actions">
          <ContextMenuItem>Copy</ContextMenuItem>
        </ContextMenu>
      }
    >
      <div>
        <Checkbox id="first-toggle">First</Checkbox>
        <Checkbox id="second-toggle">Second</Checkbox>
        <Button>Third</Button>
      </div>
    </ContextMenuTrigger>
  )
  return onOpenChange
}

describe("ContextMenuTrigger", () => {
  it("leaves the ids of the controls inside the target alone", async () => {
    renderTarget()

    // react-aria merges ids after render, so give it the effects to do so.
    await waitFor(() => {
      expect(document.querySelectorAll("#first-toggle")).toHaveLength(1)
    })
    expect(document.querySelectorAll("#second-toggle")).toHaveLength(1)
    const thirdId = screen.getByRole("button", { name: "Third" }).id
    expect(thirdId).not.toBe("first-toggle")
    expect(thirdId).not.toBe("second-toggle")
  })

  it("does not hand menu trigger behavior to the controls inside", () => {
    renderTarget()

    const third = screen.getByRole("button", { name: "Third" })
    expect(third.getAttribute("aria-haspopup")).toBeNull()
    expect(third.getAttribute("aria-expanded")).toBeNull()
  })

  it("opens the menu on right click anywhere in the target", async () => {
    const onOpenChange = renderTarget()

    fireEvent.contextMenu(screen.getByText("Second"))

    expect(await screen.findByRole("menuitem", { name: "Copy" })).toBeTruthy()
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})
