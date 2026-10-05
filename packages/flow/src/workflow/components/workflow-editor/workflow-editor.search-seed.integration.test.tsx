// @vitest-environment jsdom

import { ExpressionEditor } from "@flow/expression-editor"
import { selectExpressionText } from "@flow/expression-editor/testing"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { createWorkflowNode } from "../../node-registry/node-factory"
import { createNodeRegistry } from "../../node-registry/registry"
import type { WorkflowGraphState, WorkflowNode } from "../../types"
import { WorkflowEditor } from "./workflow-editor"

// The real canvas needs React Flow's measuring DOM. What this suite needs from
// it is a real expression field inside the editor, where Mod+F starts.
vi.mock("../workflow-canvas", () => ({
  WorkflowCanvas: () => (
    <div data-testid="expression-host">
      <ExpressionEditor
        value="{{ price }} + {{ rate }}"
        variables={[]}
        onCommit={() => {}}
      />
    </div>
  ),
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
  nodes: [inline("a", 0, ["{{ price }}"]), inline("b", 100, ["{{ rate }}"])],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  document: { id: "doc", name: "Doc", version: 1, metadata: {} },
}

function renderEditor() {
  return render(
    <WorkflowEditor initialGraph={graph} definitions={builtinBaseDefinitions}>
      <WorkflowEditor.Body>
        <WorkflowEditor.Canvas />
        <WorkflowEditor.Search />
      </WorkflowEditor.Body>
    </WorkflowEditor>
  )
}

function pressModFInExpression() {
  const content = document.querySelector(".cm-content")
  if (!content) {
    throw new Error("No mounted expression editor found")
  }
  fireEvent.keyDown(content, { key: "f", ctrlKey: true })
}

const searchInput = () =>
  screen.getByLabelText<HTMLInputElement>("Search nodes and variables")

describe("WorkflowEditor search seeding from an expression field", () => {
  afterEach(() => {
    cleanup()
  })

  it("opens with the variable selected in the expression as the query", () => {
    renderEditor()
    act(() => {
      selectExpressionText(screen.getByTestId("expression-host"), 3, 8)
    })

    pressModFInExpression()

    expect(searchInput().value).toBe("price")
    expect(document.activeElement).toBe(searchInput())
    expect(screen.getByTestId("workflow-search-counter").textContent).toBe(
      "1 / 1"
    )
  })

  it("replaces the query of an open search with the selected variable", () => {
    renderEditor()
    act(() => {
      selectExpressionText(screen.getByTestId("expression-host"), 3, 8)
    })
    pressModFInExpression()

    act(() => {
      selectExpressionText(screen.getByTestId("expression-host"), 17, 21)
    })
    pressModFInExpression()

    const input = searchInput()
    expect(input.value).toBe("rate")
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe("rate".length)
  })
})
