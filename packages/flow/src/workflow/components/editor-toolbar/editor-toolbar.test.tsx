// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { EditorToolbar, type EditorToolbarProps } from "./editor-toolbar"

function renderToolbar(overrides: Partial<EditorToolbarProps> = {}) {
  const props: EditorToolbarProps = {
    canUndo: true,
    canRedo: true,
    lastError: null,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onClearError: vi.fn(),
    canCopyAll: true,
    onCopyAll: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
  render(<EditorToolbar {...props} />)
  return props
}

describe("EditorToolbar", () => {
  afterEach(() => {
    cleanup()
  })

  it("runs undo and redo, and disables them when the history is empty", async () => {
    const user = userEvent.setup()
    const props = renderToolbar({ canRedo: false })

    await user.click(screen.getByRole("button", { name: "Undo" }))
    expect(props.onUndo).toHaveBeenCalledOnce()
    expect(
      screen.getByRole("button", { name: "Redo" }).hasAttribute("disabled")
    ).toBe(true)
  })

  it("hides undo and redo when showHistory is false", () => {
    renderToolbar({ showHistory: false })

    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Redo" })).toBeNull()
  })

  it("copies all nodes and reports it", async () => {
    const user = userEvent.setup()
    const props = renderToolbar()

    await user.click(screen.getByRole("button", { name: "Copy all nodes" }))

    expect(props.onCopyAll).toHaveBeenCalledOnce()
    expect(await screen.findByText("All nodes copied.")).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "Dismiss" }))
    expect(screen.queryByText("All nodes copied.")).toBeNull()
    expect(props.onClearError).toHaveBeenCalledOnce()
  })

  it("leaves a failed copy to the store error", async () => {
    const user = userEvent.setup()
    renderToolbar({ onCopyAll: vi.fn().mockResolvedValue(false) })

    await user.click(screen.getByRole("button", { name: "Copy all nodes" }))

    expect(screen.queryByRole("status")).toBeNull()
  })

  it("disables copying when there are no nodes", () => {
    renderToolbar({ canCopyAll: false })

    expect(
      screen
        .getByRole("button", { name: "Copy all nodes" })
        .hasAttribute("disabled")
    ).toBe(true)
  })

  it("shows the store error over its own status", () => {
    renderToolbar({ lastError: "Cannot connect these ports." })

    expect(screen.getByText("Cannot connect these ports.")).toBeTruthy()
  })

  it("renders the search toggle only when search is offered", () => {
    renderToolbar()
    expect(screen.queryByRole("button", { name: "Search" })).toBeNull()
  })

  it("toggles search open and closed", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderToolbar({ search: { isOpen: false, onOpenChange } })

    const toggle = screen.getByRole("button", { name: "Search" })
    expect(toggle.getAttribute("aria-pressed")).toBe("false")

    await user.click(toggle)
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("marks the search toggle pressed while search is open", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderToolbar({ search: { isOpen: true, onOpenChange } })

    const toggle = screen.getByRole("button", { name: "Search" })
    expect(toggle.getAttribute("aria-pressed")).toBe("true")

    await user.click(toggle)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("mounts the search host, hidden, whether or not search is offered", () => {
    const searchHostRef = vi.fn()
    renderToolbar({ searchHostRef })

    const host = screen.getByTestId("editor-toolbar-search-host")
    expect(searchHostRef).toHaveBeenCalledWith(host)
    expect(host.hidden).toBe(true)
  })

  it("trades its actions for the embedded search while it is open", async () => {
    const search = { isOpen: true, isEmbedded: true, onOpenChange: vi.fn() }
    renderToolbar({ search })

    const host = screen.getByTestId("editor-toolbar-search-host")
    expect(host.hidden).toBe(false)
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Copy all nodes" })).toBeNull()
  })

  it("keeps its actions while an open search renders elsewhere", () => {
    renderToolbar({
      search: { isOpen: true, isEmbedded: false, onOpenChange: vi.fn() },
    })

    expect(screen.getByTestId("editor-toolbar-search-host").hidden).toBe(true)
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy()
  })
})
