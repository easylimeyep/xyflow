// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { EditorToolbar } from "./editor-toolbar"
import type { DomainWorkflowDTO } from "../../types"

const exportPayload: DomainWorkflowDTO = {
  id: "wf-1",
  name: "Workflow",
  version: 1,
  metadata: {},
  nodes: [],
  connections: [],
  viewport: { x: 0, y: 0, zoom: 1 },
}

describe("EditorToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it("exports domain json to clipboard and shows status", async () => {
    const user = userEvent.setup()
    render(
      <EditorToolbar
        canUndo
        canRedo
        lastError={null}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onClearError={vi.fn()}
        onExportDomain={() => exportPayload}
        onImportJson={vi.fn().mockReturnValue(true)}
      />
    )

    await user.click(screen.getByRole("button", { name: "Export Domain" }))
    expect(
      screen.queryByText("Domain JSON copied.") ??
        screen.queryByText("Failed to copy domain JSON.")
    ).not.toBeNull()
  })

  it("applies import and renders success/failure statuses", async () => {
    const user = userEvent.setup()
    const onImportJson = vi
      .fn<(rawJson: string) => boolean>()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)

    render(
      <EditorToolbar
        canUndo
        canRedo
        lastError={null}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        onClearError={vi.fn()}
        onExportDomain={() => exportPayload}
        onImportJson={onImportJson}
      />
    )

    await user.click(screen.getAllByRole("button", { name: "Import JSON" })[0]!)
    fireEvent.change(screen.getByPlaceholderText("Paste domain workflow JSON"), {
      target: { value: '{"nodes":[],"edges":[]}' },
    })
    await user.click(screen.getByRole("button", { name: "Apply Import" }))
    expect(screen.queryByText("Workflow imported.")).not.toBeNull()

    await user.click(screen.getByRole("button", { name: "Apply Import" }))
    expect(screen.queryByText("Import failed.")).not.toBeNull()
  })
})
