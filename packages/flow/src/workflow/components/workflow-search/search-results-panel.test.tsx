// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { createNodeRegistry } from "../../node-registry/registry"
import { useNodeSearchStatus } from "../../store"
import type { WorkflowGraphState, WorkflowNode } from "../../types"
import type { RevealNode } from "../workflow-canvas"
import { WorkflowEditor } from "../workflow-editor/workflow-editor"

const revealSpy = vi.fn<RevealNode>()

// The search needs only the reveal entry point the canvas registers, and
// somewhere to put focus; the real canvas needs React Flow's measuring DOM.
vi.mock("../workflow-canvas", () => ({
  WorkflowCanvas: ({
    onRevealNodeChange,
  }: {
    onRevealNodeChange?: (reveal: RevealNode | null) => void
  }) => {
    onRevealNodeChange?.(revealSpy)
    return <button type="button">canvas-focus-target</button>
  },
}))

// The virtualized list lays out only what fits its viewport, which jsdom
// reports as zero-sized; give every element room for the whole list.
const sizeSpies: Array<{ mockRestore: () => void }> = []
beforeAll(() => {
  for (const key of ["clientWidth", "clientHeight"] as const) {
    sizeSpies.push(
      vi.spyOn(HTMLElement.prototype, key, "get").mockImplementation(() => 1000)
    )
  }
})
afterAll(() => {
  sizeSpies.forEach((spy) => spy.mockRestore())
})

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

function priceNode(): WorkflowNode {
  const node = createWorkflowNode(
    registry,
    "inlineExpression",
    { x: 0, y: -100 },
    "price"
  )
  node.data.config.template = ["{{ amount }}"]
  return { ...node, id: "p" }
}

// "price": p's label (1), a's two references (2, 3), b's reference (4).
const graph: WorkflowGraphState = {
  nodes: [
    priceNode(),
    inline("a", 0, ["{{ price }} {{ price }}"]),
    inline("b", 100, ["{{ other }}", "{{ price.total }}"]),
  ],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  document: { id: "doc", name: "Doc", version: 1, metadata: {} },
}

function StatusProbe() {
  return <span data-testid="p-status">{useNodeSearchStatus("p")}</span>
}

function SelectionProbe() {
  const { selectedNodeIds } = WorkflowEditor.use.selection()
  return <span data-testid="selection">{selectedNodeIds.join(",")}</span>
}

function renderEditor() {
  return render(
    <WorkflowEditor initialGraph={graph} definitions={builtinBaseDefinitions}>
      <WorkflowEditor.Body>
        <WorkflowEditor.Canvas />
        <WorkflowEditor.Search />
      </WorkflowEditor.Body>
      <StatusProbe />
      <SelectionProbe />
    </WorkflowEditor>
  )
}

const input = () => screen.getByLabelText("Search nodes and variables")
const counterButton = () => screen.getByTestId("workflow-search-counter")
const rows = () => screen.queryAllByTestId("workflow-search-result")
const rowText = (row: HTMLElement) =>
  [...row.querySelectorAll("span")].map((span) => span.textContent)

async function openAndSearch(query: string) {
  const user = userEvent.setup()
  fireEvent.keyDown(screen.getByText("canvas-focus-target"), {
    key: "f",
    ctrlKey: true,
  })
  await user.type(input(), query)
  return user
}

async function openPanel(query = "price") {
  const user = await openAndSearch(query)
  await user.click(counterButton())
  return user
}

describe("search results panel", () => {
  afterEach(() => {
    cleanup()
    revealSpy.mockClear()
  })

  it("toggles from the counter, which reports its state", async () => {
    renderEditor()
    const user = await openAndSearch("price")
    expect(counterButton().getAttribute("aria-expanded")).toBe("false")
    expect(counterButton().getAttribute("aria-label")).toBe(
      "Match 1 of 4, show all matches"
    )

    await user.click(counterButton())
    expect(counterButton().getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByTestId("workflow-search-results")).toBeTruthy()

    await user.click(counterButton())
    expect(screen.queryByTestId("workflow-search-results")).toBeNull()
  })

  it("announces the position in a live region beside the counter", async () => {
    renderEditor()
    const user = await openAndSearch("price")
    const live = document.querySelector("[aria-live=polite]")!

    await user.keyboard("{Enter}")

    expect(live.textContent).toBe("2 / 4")
    expect(counterButton().hasAttribute("aria-live")).toBe(false)
  })

  it("groups rows by node, numbered like the counter", async () => {
    renderEditor()
    await openPanel()

    expect(
      screen.getAllByRole("group").map((group) => group.textContent)
    ).toHaveLength(3)
    expect(rows().map(rowText)).toEqual([
      ["1", "Label", "price"],
      ["2", "Tokens #1", "{{ price }} {{ price }}"],
      ["3", "Tokens #1", "{{ price }} {{ price }}"],
      ["4", "Tokens #2", "{{ price.total }}"],
    ])
    expect(rows()[0]!.getAttribute("aria-selected")).toBe("true")
  })

  it("jumps to a picked row without selecting its node", async () => {
    renderEditor()
    const user = await openPanel()

    await user.click(rows()[3]!)

    expect(counterButton().textContent).toBe("4 / 4")
    expect(revealSpy).toHaveBeenLastCalledWith("b")
    expect(screen.getByTestId("selection").textContent).toBe("")
    expect(screen.getByTestId("workflow-search-results")).toBeTruthy()
  })

  it("moves focus between rows without navigating, and picks with Enter", async () => {
    renderEditor()
    const user = await openPanel()
    await user.click(input())
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(rows()[0])
    revealSpy.mockClear()

    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(counterButton().textContent).toBe("1 / 4")
    expect(revealSpy).not.toHaveBeenCalled()

    await user.keyboard("{Enter}")
    expect(counterButton().textContent).toBe("3 / 4")
  })

  it("follows Enter in the input with the selected row", async () => {
    renderEditor()
    const user = await openPanel()
    await user.click(input())

    await user.keyboard("{Enter}{Enter}")

    expect(rows()[2]!.getAttribute("aria-selected")).toBe("true")
  })

  it("returns focus to the input on Escape and stays open", async () => {
    renderEditor()
    const user = await openPanel()
    await user.click(input())
    await user.keyboard("{ArrowDown}")

    await user.keyboard("{Escape}")

    expect(document.activeElement).toBe(input())
    expect(screen.getByTestId("workflow-search")).toBeTruthy()
    expect(screen.getByTestId("workflow-search-results")).toBeTruthy()
  })

  it("does nothing on ArrowDown while the panel is collapsed", async () => {
    renderEditor()
    const user = await openAndSearch("price")

    await user.keyboard("{ArrowDown}")

    expect(document.activeElement).toBe(input())
  })

  it("filters by source, flags it, and resets", async () => {
    renderEditor()
    const user = await openPanel()

    await user.click(screen.getByRole("button", { name: /References/ }))
    expect(counterButton().textContent).toContain("1 / 1")
    expect(screen.getByTestId("workflow-search-filtered")).toBeTruthy()
    expect(counterButton().getAttribute("aria-label")).toContain("filtered")

    await user.click(screen.getByRole("button", { name: /Labels/ }))
    expect(screen.getByTestId("workflow-search-empty").textContent).toContain(
      "4 matches hidden by filters"
    )
    expect(screen.getByTestId("p-status").textContent).toBe("none")

    await user.click(screen.getByRole("button", { name: "Reset filters" }))
    expect(rows()).toHaveLength(4)
    expect(screen.queryByTestId("workflow-search-filtered")).toBeNull()
  })

  it("narrows with whole word and matches case on request", async () => {
    renderEditor()
    const user = await openAndSearch("price")

    await user.click(screen.getByRole("button", { name: "Match case" }))
    await user.clear(input())
    await user.type(input(), "Price")
    expect(counterButton().textContent).toBe("No results")

    await user.click(screen.getByRole("button", { name: "Match case" }))
    await user.click(screen.getByRole("button", { name: "Match whole word" }))
    expect(counterButton().textContent).toBe("1 / 4")
  })

  it("keeps the panel open across closing and reopening", async () => {
    renderEditor()
    const user = await openPanel()
    await user.click(screen.getByRole("button", { name: "Close search" }))

    await openAndSearch("price")

    expect(screen.getByTestId("workflow-search-results")).toBeTruthy()
  })

  it("hints while the query is empty", async () => {
    renderEditor()
    const user = await openAndSearch("x")
    await user.click(counterButton())
    await user.clear(input())

    expect(screen.getByTestId("workflow-search-empty").textContent).toContain(
      "Type to find"
    )
  })
})
