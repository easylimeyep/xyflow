// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReactFlowProvider, type NodeProps } from "@xyflow/react"
import { useEffect, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  GroupCanvasNode,
  GroupCanvasNodeData,
} from "../../groups/group-canvas-nodes"
import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { RuntimeObservationProvider } from "../../runtime"
import {
  WorkflowStoreProvider,
  createWorkflowStore,
  useWorkflowStoreApi,
} from "../../store"
import type {
  WorkflowCanvasMode,
  WorkflowGraphState,
  WorkflowRuntimeOverlay,
} from "../../types"
import { GroupCanvasProvider } from "./group-canvas-context"
import { GroupCard } from "./group-card"
import { GroupFrame } from "./group-frame"

function graph(memberIds: string[] = ["a"]): WorkflowGraphState {
  return {
    nodes: ["a", "b"].map((id, index) => ({
      id,
      type: "result",
      position: { x: 100 + index * 200, y: 100 },
      measured: { width: 100, height: 50 },
      data: {
        kind: "result",
        label: id,
        config: { category: "true" },
        ...(memberIds.includes(id) ? { groupId: "g" } : {}),
      },
    })),
    edges: [],
    groups: [
      {
        id: "g",
        label: "Parse",
        color: "blue",
        x: -500,
        y: -500,
        width: 2000,
        height: 2000,
        collapsed: false,
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    document: { id: "d", name: "d", version: 1, metadata: {} },
  }
}

function nodeProps(
  data: Partial<GroupCanvasNodeData> = {},
  selected = false
): NodeProps<GroupCanvasNode> {
  return {
    id: "group-frame:g",
    type: "groupFrame",
    data: {
      groupId: "g",
      label: "Parse",
      color: "blue",
      memberIds: ["a"],
      collapsed: false,
      editable: true,
      ...data,
    },
    selected,
    dragging: false,
    zIndex: -1,
    selectable: false,
    deletable: false,
    draggable: true,
    isConnectable: false,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  }
}

let storeApi: ReturnType<typeof createWorkflowStore> | null = null

function CaptureStore() {
  const api = useWorkflowStoreApi() as ReturnType<typeof createWorkflowStore>
  useEffect(() => {
    storeApi = api
  }, [api])
  return null
}

function renderInEditor(
  ui: ReactNode,
  options: {
    initialGraph?: WorkflowGraphState
    setCollapsed?: (groupId: string, collapsed: boolean) => void
    mode?: WorkflowCanvasMode
    overlay?: WorkflowRuntimeOverlay
  } = {}
) {
  return render(
    <WorkflowStoreProvider
      definitions={builtinBaseDefinitions}
      initialGraph={options.initialGraph ?? graph()}
    >
      <RuntimeObservationProvider
        mode={options.mode ?? "edit"}
        overlay={options.overlay}
      >
        <ReactFlowProvider>
          <GroupCanvasProvider
            value={{ setCollapsed: options.setCollapsed ?? vi.fn() }}
          >
            <CaptureStore />
            {ui}
          </GroupCanvasProvider>
        </ReactFlowProvider>
      </RuntimeObservationProvider>
    </WorkflowStoreProvider>
  )
}

function store() {
  if (!storeApi) throw new Error("store not captured")
  return storeApi.getState()
}

describe("GroupFrame", () => {
  afterEach(() => {
    cleanup()
    storeApi = null
  })

  it("shows the label and member count and describes itself", () => {
    renderInEditor(<GroupFrame {...nodeProps({ memberIds: ["a", "b"] })} />)

    expect(screen.getByTestId("workflow-group-title").textContent).toBe("Parse")
    expect(
      screen.getByRole("group", { name: "Group Parse, 2 nodes" })
    ).toBeTruthy()
  })

  it("renames on double-click and Enter", async () => {
    const user = userEvent.setup()
    renderInEditor(<GroupFrame {...nodeProps()} />)

    await user.dblClick(screen.getByTestId("workflow-group-title"))
    const input = screen.getByLabelText("Group name")
    await user.clear(input)
    await user.type(input, "Parse response{Enter}")

    expect(store().graph.groups[0]?.label).toBe("Parse response")
  })

  it("keeps the label when the new one is empty, and on Escape", async () => {
    const user = userEvent.setup()
    renderInEditor(<GroupFrame {...nodeProps()} />)

    await user.dblClick(screen.getByTestId("workflow-group-title"))
    await user.clear(screen.getByLabelText("Group name"))
    await user.keyboard("{Enter}")
    expect(store().graph.groups[0]?.label).toBe("Parse")

    await user.dblClick(screen.getByTestId("workflow-group-title"))
    await user.type(screen.getByLabelText("Group name"), "x{Escape}")
    expect(store().graph.groups[0]?.label).toBe("Parse")
    expect(screen.queryByLabelText("Group name")).toBeNull()
  })

  it("recolors from the color picker", async () => {
    const user = userEvent.setup()
    renderInEditor(<GroupFrame {...nodeProps()} />)

    await user.click(screen.getByRole("button", { name: "Group color" }))
    await user.click(await screen.findByRole("radio", { name: "green" }))

    expect(store().graph.groups[0]?.color).toBe("green")
  })

  it("fits the frame to its members", async () => {
    const user = userEvent.setup()
    renderInEditor(<GroupFrame {...nodeProps()} />)

    await user.click(screen.getByRole("button", { name: "Fit to contents" }))

    expect(store().graph.groups[0]?.width).toBeLessThan(2000)
  })

  it("cannot fit an empty group", () => {
    renderInEditor(<GroupFrame {...nodeProps({ memberIds: [] })} />, {
      initialGraph: graph([]),
    })

    expect(
      screen
        .getByRole("button", { name: "Fit to contents" })
        .hasAttribute("disabled")
    ).toBe(true)
  })

  it("collapses through the canvas", async () => {
    const user = userEvent.setup()
    const setCollapsed = vi.fn()
    renderInEditor(<GroupFrame {...nodeProps()} />, { setCollapsed })

    await user.click(screen.getByRole("button", { name: "Collapse group" }))

    expect(setCollapsed).toHaveBeenCalledWith("g", true)
  })

  it("selects the group when Enter is pressed on its header", () => {
    renderInEditor(<GroupFrame {...nodeProps()} />)
    act(() => store().setSelectedNodes(["b"]))

    const header = screen.getByRole("group", { name: "Group Parse, 1 node" })
    fireEvent.keyDown(header, { key: "Enter" })

    expect(store().selectedGroupIds).toEqual(["g"])
    expect(store().selectedNodeIds).toEqual([])
  })

  it("marks its label when it is the current search match", () => {
    renderInEditor(<GroupFrame {...nodeProps()} />)
    act(() => {
      store().openSearch()
      store().setSearchQuery("pars")
    })

    expect(
      screen
        .getByTestId("workflow-group-title")
        .getAttribute("data-search-state")
    ).toBe("current")
  })

  it("offers no editing when the canvas is read-only", async () => {
    const user = userEvent.setup()
    renderInEditor(<GroupFrame {...nodeProps({ editable: false })} />, {
      mode: "observe",
    })

    expect(screen.queryByRole("button", { name: "Group color" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Fit to contents" })).toBeNull()
    expect(screen.getByRole("button", { name: "Collapse group" })).toBeTruthy()

    await user.dblClick(screen.getByTestId("workflow-group-title"))
    expect(screen.queryByLabelText("Group name")).toBeNull()
  })
})

describe("GroupCard", () => {
  afterEach(() => {
    cleanup()
    storeApi = null
  })

  function cardProps(memberIds = ["a", "b"]) {
    return nodeProps({ memberIds, collapsed: true })
  }

  it("shows the label and member count and expands through the canvas", async () => {
    const user = userEvent.setup()
    const setCollapsed = vi.fn()
    renderInEditor(<GroupCard {...cardProps()} />, { setCollapsed })

    expect(screen.getByTestId("workflow-group-count").textContent).toBe("2")
    expect(
      screen.getByRole("group", { name: "Group Parse, 2 nodes, collapsed" })
    ).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "Expand group" }))
    expect(setCollapsed).toHaveBeenCalledWith("g", false)
  })

  it("shows an error indicator when a hidden member has a validation error", async () => {
    renderInEditor(<GroupCard {...cardProps()} />)
    expect(screen.queryByRole("img", { name: /has errors/ })).toBeNull()

    act(() =>
      store().setValidation({
        nodes: [{ nodeId: "b", message: "Broken" }],
      })
    )

    await waitFor(() => {
      expect(screen.getByRole("img", { name: /has errors/ })).toBeTruthy()
    })
  })

  it("summarizes the members' runtime status in observe mode", () => {
    renderInEditor(<GroupCard {...cardProps()} />, {
      mode: "observe",
      overlay: {
        nodes: { a: { status: "done" }, b: { status: "running" } },
        activeEdgeIds: [],
        traversedEdgeIds: [],
      },
    })

    expect(screen.getByRole("img", { name: "Status: running" })).toBeTruthy()
  })
})
