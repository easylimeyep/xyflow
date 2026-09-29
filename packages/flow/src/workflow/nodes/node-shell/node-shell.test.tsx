// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { NodeShell } from "./node-shell"
import { RuntimeObservationProvider } from "../../runtime"
import type { NodeRuntimeState, WorkflowRuntimeOverlay } from "../../types"

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock("../output-quick-add-affordance/output-quick-add-affordance", () => ({
  OutputQuickAddAffordance: () => null,
}))

vi.mock("@flow/ui/components/tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="node-validation-tooltip">{children}</div>
  ),
}))

describe("NodeShell validation display", () => {
  afterEach(() => {
    cleanup()
  })

  it("marks nodes with visible validation and exposes all messages", () => {
    render(
      <NodeShell
        nodeId="node-1"
        title="Keyword"
        subtitle=""
        selected
        validationMessages={[
          {
            key: "node-1:first",
            nodeId: "node-1",
            message: "First node problem.",
            severity: "error",
          },
          {
            key: "node-1:second",
            nodeId: "node-1",
            message: "Second node problem.",
            severity: "warning",
          },
        ]}
      />
    )

    expect(screen.getByTestId("workflow-node").dataset.validation).toBe("true")
    expect(screen.getByTestId("node-validation-indicator")).toBeTruthy()
    expect(screen.getByText("First node problem.")).toBeTruthy()
    expect(screen.getByText("Second node problem.")).toBeTruthy()
  })

  it("does not render validation affordance when there are no messages", () => {
    render(<NodeShell nodeId="node-1" title="Keyword" subtitle="" />)

    expect(screen.getByTestId("workflow-node").dataset.validation).toBe("false")
    expect(screen.queryByTestId("node-validation-indicator")).toBeNull()
  })
})

function renderWithRuntime(nodeId: string, state: NodeRuntimeState) {
  const overlay: WorkflowRuntimeOverlay = {
    nodes: { [nodeId]: state },
    activeEdgeIds: [],
    traversedEdgeIds: [],
  }

  return render(
    <RuntimeObservationProvider mode="observe" overlay={overlay}>
      <NodeShell nodeId={nodeId} title="Keyword" subtitle="" />
    </RuntimeObservationProvider>
  )
}

describe("NodeShell runtime status display", () => {
  afterEach(() => {
    cleanup()
  })

  it.each([
    ["done"],
    ["running"],
    ["waiting"],
    ["failed"],
    ["skipped"],
  ] as const)("renders the %s status badge", (status) => {
    renderWithRuntime("node-1", { status })

    expect(screen.getByTestId("workflow-node").dataset.nodeStatus).toBe(status)
    expect(screen.getByTestId("node-status-badge").textContent).toContain(
      status
    )
  })

  it("renders the iteration counter when present", () => {
    renderWithRuntime("node-1", {
      status: "running",
      iteration: { current: 2, total: 3 },
    })

    expect(screen.getByTestId("node-iteration-badge").textContent).toContain(
      "2 / 3"
    )
  })

  it("renders the error text only for failed nodes with an error", () => {
    renderWithRuntime("node-1", {
      status: "failed",
      error: "boom while running",
    })

    const error = screen.getByTestId("node-error-text")
    expect(error.textContent).toBe("boom while running")
    expect(error.getAttribute("title")).toBe("boom while running")
  })

  it("stays neutral when no runtime state is present", () => {
    render(<NodeShell nodeId="node-1" title="Keyword" subtitle="" />)

    expect(
      screen.getByTestId("workflow-node").dataset.nodeStatus
    ).toBeUndefined()
    expect(screen.queryByTestId("node-status-badge")).toBeNull()
    expect(screen.queryByTestId("node-iteration-badge")).toBeNull()
    expect(screen.queryByTestId("node-error-text")).toBeNull()
  })
})

describe("NodeShell search marks", () => {
  afterEach(() => {
    cleanup()
  })

  function panelOf(searchState?: "none" | "match" | "current") {
    render(
      <NodeShell
        nodeId="node-1"
        title="Keyword"
        subtitle=""
        searchState={searchState}
      />
    )
    const root = screen.getByTestId("workflow-node")
    return { root, panel: root.firstElementChild as HTMLElement }
  }

  it("renders no mark when the node is not a match", () => {
    const { root, panel } = panelOf("none")

    expect(root.dataset.searchState).toBeUndefined()
    expect(panel.className).not.toContain("ring-amber-400/60")
    expect(panel.className).not.toContain("ring-primary")
  })

  it("renders a subtle mark for a match", () => {
    const { root, panel } = panelOf("match")

    expect(root.dataset.searchState).toBe("match")
    expect(panel.className).toContain("ring-amber-400/60")
  })

  it("renders a stronger mark for the current match", () => {
    const { root, panel } = panelOf("current")

    expect(root.dataset.searchState).toBe("current")
    expect(panel.className).toContain("ring-primary")
    expect(panel.className).not.toContain("ring-amber-400/60")
  })
})

describe("NodeShell field-level search marks", () => {
  afterEach(() => {
    cleanup()
  })

  it("demotes the current node to an outline when a field holds the mark", () => {
    render(
      <NodeShell
        nodeId="node-1"
        title="Keyword"
        subtitle=""
        searchState="current"
        hasCurrentSearchField
      />
    )

    const panel = screen.getByTestId("workflow-node")
      .firstElementChild as HTMLElement
    expect(panel.className).toContain("ring-primary/60")
    expect(panel.className).not.toContain("ring-[3px]")
  })

  it("keeps the strong node mark when the current match has no field", () => {
    render(
      <NodeShell
        nodeId="node-1"
        title="Keyword"
        subtitle=""
        searchState="current"
      />
    )

    const panel = screen.getByTestId("workflow-node")
      .firstElementChild as HTMLElement
    expect(panel.className).toContain("ring-[3px]")
  })
})
