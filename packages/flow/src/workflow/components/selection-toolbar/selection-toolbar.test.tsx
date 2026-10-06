// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { WorkflowStoreProvider, useWorkflowStore } from "../../store"
import {
  navigatorClipboardAdapter,
  setClipboardAdapter,
} from "../../store/clipboard-io"
import type { WorkflowGraphState } from "../../types"
import { SelectionToolbar } from "./selection-toolbar"

const clipboardWriteTextMock = vi.fn<(text: string) => Promise<boolean>>(
  async () => true
)

function createInitialGraph(): WorkflowGraphState {
  return {
    nodes: [
      {
        id: "node-1",
        type: "setVariable",
        position: { x: 0, y: 0 },
        data: {
          kind: "setVariable",
          label: "Setter",
          config: { variableName: "myVar", valueExpression: "" },
        },
      },
      {
        id: "node-2",
        type: "extractor",
        position: { x: 240, y: 0 },
        data: {
          kind: "extractor",
          label: "Extractor",
          config: { tokenNumber: 1, extractExpression: "", unlimited: false },
        },
      },
    ],
    edges: [],
    groups: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    document: { id: "test", name: "Test", version: 1, metadata: {} },
  }
}

/** The default graph with both nodes in group `g`. */
function groupedGraph(collapsed = false): WorkflowGraphState {
  const graph = createInitialGraph()
  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({
      ...node,
      data: { ...node.data, groupId: "g" },
    })),
    groups: [
      {
        id: "g",
        label: "Group 1",
        color: "blue",
        x: -40,
        y: -80,
        width: 600,
        height: 300,
        collapsed,
      },
    ],
  }
}

function SelectNodes({
  nodeIds,
  groupIds = NO_GROUPS,
}: {
  nodeIds: string[]
  groupIds?: string[]
}) {
  const setSelectedNodes = useWorkflowStore((state) => state.setSelectedNodes)
  const setSelectedGroups = useWorkflowStore((state) => state.setSelectedGroups)
  useEffect(() => {
    setSelectedNodes(nodeIds)
    setSelectedGroups(groupIds)
  }, [groupIds, nodeIds, setSelectedGroups, setSelectedNodes])
  return null
}

function toolbarButtonNames() {
  const toolbar = screen.getByRole("group", { name: "Selection actions" })
  return Array.from(toolbar.querySelectorAll("button")).map((button) =>
    button.getAttribute("aria-label")
  )
}

function GraphProbe() {
  const nodeCount = useWorkflowStore((state) => state.graph.nodes.length)
  const groupCount = useWorkflowStore((state) => state.graph.groups.length)
  const selectedNodeIds = useWorkflowStore((state) => state.selectedNodeIds)
  return (
    <>
      <div data-testid="node-count">{nodeCount}</div>
      <div data-testid="group-count">{groupCount}</div>
      <div data-testid="selected-node-ids">{selectedNodeIds.join(",")}</div>
    </>
  )
}

const SELECTED = ["node-1", "node-2"]
const NO_GROUPS: string[] = []

function renderToolbar(
  initialGraph: WorkflowGraphState = createInitialGraph(),
  nodeIds: string[] = SELECTED,
  groupIds: string[] = NO_GROUPS
) {
  return render(
    <WorkflowStoreProvider
      initialGraph={initialGraph}
      definitions={builtinBaseDefinitions}
    >
      <SelectNodes nodeIds={nodeIds} groupIds={groupIds} />
      <GraphProbe />
      <SelectionToolbar />
    </WorkflowStoreProvider>
  )
}

describe("SelectionToolbar", () => {
  beforeEach(() => {
    clipboardWriteTextMock.mockClear()
    // user-event installs its own `navigator.clipboard`, so the test swaps
    // the store's clipboard adapter instead of the browser API.
    setClipboardAdapter({
      writeText: clipboardWriteTextMock,
      readText: async () => null,
    })
  })

  afterEach(() => {
    cleanup()
    setClipboardAdapter(navigatorClipboardAdapter)
  })

  it("renders the commands for ungrouped nodes in a group", () => {
    renderToolbar()

    expect(toolbarButtonNames()).toEqual([
      "Copy",
      "Duplicate",
      "Group",
      "Delete",
    ])
  })

  it("offers neither Group nor Ungroup for member nodes", () => {
    renderToolbar(groupedGraph())

    expect(toolbarButtonNames()).toEqual(["Copy", "Duplicate", "Delete"])
  })

  it("shows the group commands for one selected group", () => {
    renderToolbar(groupedGraph(), [], ["g"])

    expect(toolbarButtonNames()).toEqual([
      "Copy",
      "Duplicate",
      "Collapse",
      "Ungroup",
      "Delete",
    ])
  })

  it("reads Expand for a selected collapsed group", () => {
    renderToolbar(groupedGraph(true), [], ["g"])

    expect(toolbarButtonNames()).toContain("Expand")
  })

  it("groups the selected nodes", async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole("button", { name: "Group" }))

    await waitFor(() => {
      expect(screen.getByTestId("group-count").textContent).toBe("1")
    })
  })

  it("renders delete with the destructive variant after a separator", () => {
    renderToolbar()

    const deleteButton = screen.getByRole("button", { name: "Delete" })
    expect(deleteButton.getAttribute("data-variant")).toBe("destructive")
    expect(
      screen.getByRole("button", { name: "Copy" }).getAttribute("data-variant")
    ).toBe("ghost")
    expect(
      deleteButton.previousElementSibling?.getAttribute("aria-hidden")
    ).toBe("true")
  })

  it("marks the toolbar so React Flow ignores drags and pans on it", () => {
    renderToolbar()

    const toolbar = screen.getByTestId("selection-toolbar")
    expect(toolbar.classList.contains("nodrag")).toBe(true)
    expect(toolbar.classList.contains("nopan")).toBe(true)
  })

  it("does not let presses reach the canvas behind it", async () => {
    const user = userEvent.setup()
    const onCanvasPointerDown = vi.fn()
    const onCanvasClick = vi.fn()
    render(
      <WorkflowStoreProvider
        initialGraph={createInitialGraph()}
        definitions={builtinBaseDefinitions}
      >
        <SelectNodes nodeIds={SELECTED} />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- stands in for the canvas. */}
        <div onPointerDown={onCanvasPointerDown} onClick={onCanvasClick}>
          <SelectionToolbar />
        </div>
      </WorkflowStoreProvider>
    )

    await user.click(screen.getByRole("button", { name: "Duplicate" }))

    expect(onCanvasPointerDown).not.toHaveBeenCalled()
    expect(onCanvasClick).not.toHaveBeenCalled()
  })

  it.each(["Copy", "Duplicate", "Delete"])(
    "calls onAfterCommand after %s runs",
    async (name) => {
      const user = userEvent.setup()
      const onAfterCommand = vi.fn()
      render(
        <WorkflowStoreProvider
          initialGraph={createInitialGraph()}
          definitions={builtinBaseDefinitions}
        >
          <SelectNodes nodeIds={SELECTED} />
          <SelectionToolbar onAfterCommand={onAfterCommand} />
        </WorkflowStoreProvider>
      )

      await user.click(screen.getByRole("button", { name }))

      expect(onAfterCommand).toHaveBeenCalledTimes(1)
    }
  )

  it("copies the selection to the clipboard", async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole("button", { name: "Copy" }))

    await waitFor(() => expect(clipboardWriteTextMock).toHaveBeenCalledTimes(1))
    const payload = String(clipboardWriteTextMock.mock.calls[0]?.[0])
    expect(payload).toContain("Setter")
    expect(payload).toContain("Extractor")
  })

  it("duplicates the selection and selects the copies", async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole("button", { name: "Duplicate" }))

    expect(screen.getByTestId("node-count").textContent).toBe("4")
    const selected = screen
      .getByTestId("selected-node-ids")
      .textContent?.split(",")
    expect(selected).toHaveLength(2)
    expect(selected).not.toContain("node-1")
    expect(clipboardWriteTextMock).not.toHaveBeenCalled()
  })

  it("deletes the selection", async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole("button", { name: "Delete" }))

    expect(screen.getByTestId("node-count").textContent).toBe("0")
    expect(screen.getByTestId("selected-node-ids").textContent).toBe("")
  })

  it.each([
    ["Copy", "CopyCtrl+C"],
    ["Duplicate", "DuplicateCtrl+D"],
    ["Delete", "DeleteDel / Backspace"],
  ])("explains %s in a tooltip on hover", async (name, text) => {
    const user = userEvent.setup()
    renderToolbar()

    await user.hover(screen.getByRole("button", { name }))

    expect((await screen.findByRole("tooltip")).textContent).toBe(text)
  })

  it("explains a button in a tooltip on keyboard focus", async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.tab()

    expect(document.activeElement?.getAttribute("aria-label")).toBe("Copy")
    expect((await screen.findByRole("tooltip")).textContent).toBe("CopyCtrl+C")
  })
})
