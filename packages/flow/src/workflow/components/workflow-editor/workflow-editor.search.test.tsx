// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { createNodeRegistry } from "../../node-registry/registry"
import { useNodeSearchStatus } from "../../store"
import type {
  WorkflowCanvasMode,
  WorkflowGraphState,
  WorkflowNode,
} from "../../types"
import { SetVariableNode } from "../../nodes/data/set-variable/component"
import type { RevealNode } from "../workflow-canvas"
import { WorkflowEditor } from "./workflow-editor"

const revealSpy = vi.fn<RevealNode>()

// A real node view renders beside the mocked canvas; its handles and output
// affordance need a React Flow instance this suite does not mount.
vi.mock("@xyflow/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@xyflow/react")>()),
  Handle: () => null,
}))

vi.mock(
  "../../nodes/output-quick-add-affordance/output-quick-add-affordance",
  () => ({ OutputQuickAddAffordance: () => null })
)

// The real canvas needs React Flow's measuring DOM; what the search needs from
// it is only the reveal entry point it registers, and somewhere to put focus.
vi.mock("../workflow-canvas", () => ({
  WorkflowCanvas: ({
    onRevealNodeChange,
  }: {
    onRevealNodeChange?: (reveal: RevealNode | null) => void
  }) => {
    onRevealNodeChange?.(revealSpy)
    return (
      <div>
        <div data-testid="canvas-pane">pane</div>
        <button type="button">canvas-focus-target</button>
        <input aria-label="expression-field" />
      </div>
    )
  },
}))

const registry = createNodeRegistry(builtinBaseDefinitions)

function inline(id: string, y: number, template: string[]): WorkflowNode {
  const node = createWorkflowNode(
    registry,
    "inlineExpression",
    { x: 0, y },
    `Inline ${id}`
  )
  node.data.config.template = template
  return { ...node, id }
}

const graph: WorkflowGraphState = {
  nodes: [
    inline("a", 0, ["{{ price }} {{ price }}"]),
    inline("b", 100, ["{{ price }}"]),
    inline("c", 200, ["{{ other }}"]),
  ],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  document: { id: "doc", name: "Doc", version: 1, metadata: {} },
}

function StatusProbe() {
  const a = useNodeSearchStatus("a")
  const b = useNodeSearchStatus("b")
  const c = useNodeSearchStatus("c")
  return <span data-testid="statuses">{`${a},${b},${c}`}</span>
}

function SelectionProbe() {
  const { selectedNodeIds } = WorkflowEditor.use.selection()
  return <span data-testid="selection">{selectedNodeIds.join(",")}</span>
}

function renderEditor({
  mode,
  outside,
}: { mode?: WorkflowCanvasMode; outside?: ReactNode } = {}) {
  return render(
    <>
      {outside}
      <WorkflowEditor
        initialGraph={graph}
        definitions={builtinBaseDefinitions}
        mode={mode}
      >
        <WorkflowEditor.Body>
          <WorkflowEditor.Canvas />
          <WorkflowEditor.Search />
        </WorkflowEditor.Body>
        <StatusProbe />
        <SelectionProbe />
      </WorkflowEditor>
    </>
  )
}

function pressModF(target: Element) {
  return fireEvent.keyDown(target, { key: "f", ctrlKey: true })
}

async function openAndSearch(query: string) {
  const user = userEvent.setup()
  pressModF(screen.getByText("canvas-focus-target"))
  await user.type(screen.getByLabelText("Search nodes and variables"), query)
  return user
}

const counter = () => screen.getByTestId("workflow-search-counter").textContent

describe("WorkflowEditor search", () => {
  afterEach(() => {
    cleanup()
    revealSpy.mockClear()
  })

  it("opens with Mod+F inside the editor and focuses the query", () => {
    renderEditor()

    const notPrevented = pressModF(screen.getByText("canvas-focus-target"))

    expect(notPrevented).toBe(false)
    expect(document.activeElement).toBe(
      screen.getByLabelText("Search nodes and variables")
    )
  })

  it("opens from inside a field in the editor too", () => {
    renderEditor()

    pressModF(screen.getByLabelText("expression-field"))

    expect(screen.getByTestId("workflow-search")).toBeTruthy()
  })

  it("leaves Mod+F outside the editor to the browser", () => {
    renderEditor({ outside: <button type="button">outside</button> })

    const notPrevented = pressModF(screen.getByText("outside"))

    expect(notPrevented).toBe(true)
    expect(screen.queryByTestId("workflow-search")).toBeNull()
  })

  it("opens in observe mode", () => {
    renderEditor({ mode: "observe" })

    pressModF(screen.getByText("canvas-focus-target"))

    expect(screen.getByTestId("workflow-search")).toBeTruthy()
  })

  it("re-focuses and selects the query when already open", async () => {
    renderEditor()
    const user = await openAndSearch("price")
    await user.click(screen.getByText("canvas-focus-target"))

    pressModF(screen.getByText("canvas-focus-target"))

    const input = screen.getByLabelText<HTMLInputElement>(
      "Search nodes and variables"
    )
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe("price".length)
  })

  it("shows the counter and wraps with Enter and Shift+Enter", async () => {
    renderEditor()
    const user = await openAndSearch("price")

    expect(counter()).toBe("1 / 3")
    await user.keyboard("{Shift>}{Enter}{/Shift}")
    expect(counter()).toBe("3 / 3")
    await user.keyboard("{Enter}")
    expect(counter()).toBe("1 / 3")
  })

  it("steps with the previous and next buttons", async () => {
    renderEditor()
    const user = await openAndSearch("price")

    await user.click(screen.getByRole("button", { name: "Next match" }))
    await user.click(screen.getByRole("button", { name: "Next match" }))
    expect(counter()).toBe("3 / 3")
    await user.click(screen.getByRole("button", { name: "Previous match" }))
    expect(counter()).toBe("2 / 3")
  })

  it("shows no results and disables navigation", async () => {
    renderEditor()
    await openAndSearch("missing")

    expect(counter()).toBe("No results")
    for (const name of ["Previous match", "Next match", "Select node"]) {
      expect(
        screen.getByRole("button", { name }).hasAttribute("disabled")
      ).toBe(true)
    }
  })

  it("marks matching nodes and the current one", async () => {
    renderEditor()
    await openAndSearch("price")

    expect(screen.getByTestId("statuses").textContent).toBe(
      "current,match,none"
    )
  })

  it("reveals each node the current match moves to", async () => {
    renderEditor()
    const user = await openAndSearch("price")
    expect(revealSpy).toHaveBeenLastCalledWith("a")

    await user.keyboard("{Enter}{Enter}")

    expect(revealSpy).toHaveBeenLastCalledWith("b")
  })

  it("steps without selecting, and selects on request", async () => {
    renderEditor()
    const user = await openAndSearch("price")
    await user.keyboard("{Shift>}{Enter}{/Shift}")
    expect(screen.getByTestId("selection").textContent).toBe("")

    await user.click(screen.getByRole("button", { name: "Select node" }))

    expect(screen.getByTestId("selection").textContent).toBe("b")
  })

  it("closes with Escape, clears the marks and returns focus", async () => {
    renderEditor()
    const target = screen.getByText("canvas-focus-target")
    target.focus()
    const user = await openAndSearch("price")

    await user.keyboard("{Escape}")

    expect(screen.queryByTestId("workflow-search")).toBeNull()
    expect(screen.getByTestId("statuses").textContent).toBe("none,none,none")
    expect(document.activeElement).toBe(target)
  })

  it("closes with the close button", async () => {
    renderEditor()
    const user = await openAndSearch("price")

    await user.click(screen.getByRole("button", { name: "Close search" }))

    expect(screen.queryByTestId("workflow-search")).toBeNull()
  })
})

describe("WorkflowEditor search focus", () => {
  afterEach(() => {
    cleanup()
  })

  it("keeps focus inside the editor after a click on non-focusable canvas", () => {
    renderEditor()
    const pane = screen.getByTestId("canvas-pane")

    fireEvent.pointerDown(pane)
    expect(
      (document.activeElement as HTMLElement).hasAttribute(
        "data-workflow-editor-root"
      )
    ).toBe(true)

    pressModF(document.activeElement!)
    expect(screen.getByTestId("workflow-search")).toBeTruthy()
  })

  it("does not steal focus from a focused element inside the editor", () => {
    renderEditor()
    const field = screen.getByLabelText("expression-field")
    field.focus()

    fireEvent.pointerDown(field)

    expect(document.activeElement).toBe(field)
  })

  it("returns focus to the editor root when the prior target is gone", async () => {
    renderEditor()
    const detached = document.createElement("button")
    document.body.append(detached)
    detached.focus()
    const user = await openAndSearch("price")
    detached.remove()

    await user.keyboard("{Escape}")

    expect(
      (document.activeElement as HTMLElement).hasAttribute(
        "data-workflow-editor-root"
      )
    ).toBe(true)
  })
})

describe("WorkflowEditor search composition", () => {
  afterEach(() => {
    cleanup()
  })

  it("is part of the default composition", () => {
    render(
      <WorkflowEditor
        initialGraph={graph}
        definitions={builtinBaseDefinitions}
      />
    )

    pressModF(screen.getByText("canvas-focus-target"))

    expect(screen.getByTestId("workflow-search")).toBeTruthy()
  })

  it("leaves Mod+F to the browser when no search part is mounted", () => {
    render(
      <WorkflowEditor initialGraph={graph} definitions={builtinBaseDefinitions}>
        <WorkflowEditor.Body>
          <WorkflowEditor.Canvas />
        </WorkflowEditor.Body>
      </WorkflowEditor>
    )

    const notPrevented = pressModF(screen.getByText("canvas-focus-target"))

    expect(notPrevented).toBe(true)
  })

  it("floats at the top-right unless given a position", () => {
    const { unmount } = renderEditor()
    pressModF(screen.getByText("canvas-focus-target"))
    expect(
      screen.getByTestId("workflow-search").getAttribute("data-position")
    ).toBe("top-right")
    unmount()

    render(
      <WorkflowEditor initialGraph={graph} definitions={builtinBaseDefinitions}>
        <WorkflowEditor.Body>
          <WorkflowEditor.Canvas />
          <WorkflowEditor.Search position="bottom-center" />
        </WorkflowEditor.Body>
      </WorkflowEditor>
    )
    pressModF(screen.getByText("canvas-focus-target"))

    expect(
      screen.getByTestId("workflow-search").getAttribute("data-position")
    ).toBe("bottom-center")
  })

  it("is exposed as WorkflowEditor.Search", () => {
    expect(WorkflowEditor.Search).toBeTypeOf("function")
  })
})

describe("WorkflowEditor search field marks", () => {
  afterEach(() => {
    cleanup()
  })

  it("moves the mark from the title to the variable field on Enter", async () => {
    const setter = createWorkflowNode(
      registry,
      "setVariable",
      { x: 0, y: 0 },
      "Calc price"
    )
    setter.data.config.variableName = "price"
    setter.data.config.valueExpression = "1"
    const setterGraph: WorkflowGraphState = { ...graph, nodes: [setter] }
    render(
      <WorkflowEditor
        initialGraph={setterGraph}
        definitions={builtinBaseDefinitions}
      >
        <WorkflowEditor.Body>
          <WorkflowEditor.Canvas />
          <WorkflowEditor.Search />
        </WorkflowEditor.Body>
        <SetVariableNode
          id={setter.id}
          type="setVariable"
          data={setter.data}
          selected={false}
          dragging={false}
          zIndex={1}
          selectable
          deletable
          draggable
          isConnectable
          positionAbsoluteX={0}
          positionAbsoluteY={0}
        />
      </WorkflowEditor>
    )
    const markOf = (element: HTMLElement) =>
      element.closest<HTMLElement>("[data-field-search-state]")?.dataset
        .fieldSearchState
    const title = screen.getByText("Calc price")
    const variableInput = screen.getByDisplayValue("price")

    const user = await openAndSearch("price")
    expect(counter()).toBe("1 / 2")
    expect(markOf(title)).toBe("current")
    expect(markOf(variableInput)).toBe("match")

    await user.keyboard("{Enter}")

    expect(counter()).toBe("2 / 2")
    expect(markOf(title)).toBe("match")
    expect(markOf(variableInput)).toBe("current")
  })
})
