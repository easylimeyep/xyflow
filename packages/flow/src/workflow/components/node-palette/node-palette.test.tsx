// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { evaluator } from "../../nodes/logic/evaluator/definition"
import { result } from "../../nodes/logic/result/definition"
import { setVariable } from "../../nodes/data/set-variable/definition"
import { builtinBaseDefinitions } from "../../node-registry/builtin-base-definitions"
import { WorkflowStoreProvider } from "../../store"
import type { WorkflowEditorAnchorRefs } from "../../tour"
import { NodePalette } from "./node-palette"

describe("NodePalette", () => {
  afterEach(() => {
    cleanup()
  })

  it("offers exactly the kinds its editor was given", () => {
    render(
      <WorkflowStoreProvider definitions={[evaluator, result]}>
        <NodePalette onAddNode={vi.fn()} />
      </WorkflowStoreProvider>
    )
    expect(screen.getByText(evaluator.title)).toBeInstanceOf(HTMLElement)
    expect(screen.getByText(result.title)).toBeInstanceOf(HTMLElement)
    expect(screen.queryByText(setVariable.title)).toBeNull()
  })

  it("merges a passed className onto the rendered element", () => {
    render(
      <WorkflowStoreProvider definitions={builtinBaseDefinitions}>
        <NodePalette onAddNode={vi.fn()} className="host-palette-lane" />
      </WorkflowStoreProvider>
    )
    expect(screen.getByLabelText("Node palette").className).toContain(
      "host-palette-lane"
    )
  })

  it("pins itself to the right only when floating", () => {
    const { rerender } = render(
      <WorkflowStoreProvider definitions={builtinBaseDefinitions}>
        <NodePalette onAddNode={vi.fn()} />
      </WorkflowStoreProvider>
    )
    const floating = screen.getByLabelText("Node palette")
    expect(floating.className).toContain("absolute")
    expect(floating.className).toContain("right-0")

    rerender(
      <WorkflowStoreProvider definitions={builtinBaseDefinitions}>
        <NodePalette onAddNode={vi.fn()} placement="inline" />
      </WorkflowStoreProvider>
    )
    const inline = screen.getByLabelText("Node palette")
    expect(inline.className).not.toContain("absolute")
    expect(inline.className).not.toContain("right-0")
    expect(inline.className).not.toContain("w-72")
  })

  it("still reports its open state when inline, so a host can style the collapse", () => {
    render(
      <WorkflowStoreProvider definitions={builtinBaseDefinitions}>
        <NodePalette onAddNode={vi.fn()} placement="inline" isOpen={false} />
      </WorkflowStoreProvider>
    )
    expect(screen.getByLabelText("Node palette").dataset.state).toBe("closed")
  })

  it("stacks above the floating search only while a floating quick add is pending", () => {
    const { rerender } = render(
      <WorkflowStoreProvider definitions={builtinBaseDefinitions}>
        <NodePalette onAddNode={vi.fn()} />
      </WorkflowStoreProvider>
    )
    expect(screen.getByLabelText("Node palette").className).not.toContain(
      "z-40"
    )

    rerender(
      <WorkflowStoreProvider definitions={builtinBaseDefinitions}>
        <NodePalette onAddNode={vi.fn()} quickAddActive />
      </WorkflowStoreProvider>
    )
    expect(screen.getByLabelText("Node palette").className).toContain("z-40")

    rerender(
      <WorkflowStoreProvider definitions={builtinBaseDefinitions}>
        <NodePalette onAddNode={vi.fn()} quickAddActive placement="inline" />
      </WorkflowStoreProvider>
    )
    expect(screen.getByLabelText("Node palette").className).not.toContain(
      "z-40"
    )
  })

  it("offers its cards for dragging only while no insertion is pending", async () => {
    const onAddNode = vi.fn()
    const card = () =>
      screen.getByRole("button", { name: `Add ${result.title} node` })
        .parentElement
    const { rerender } = render(
      <WorkflowStoreProvider definitions={[result]}>
        <NodePalette onAddNode={onAddNode} />
      </WorkflowStoreProvider>
    )
    expect(card()?.getAttribute("draggable")).toBe("true")

    rerender(
      <WorkflowStoreProvider definitions={[result]}>
        <NodePalette onAddNode={onAddNode} quickAddActive />
      </WorkflowStoreProvider>
    )
    expect(card()?.getAttribute("draggable")).toBe("false")

    await userEvent.click(
      screen.getByRole("button", { name: `Add ${result.title} node` })
    )
    expect(onAddNode).toHaveBeenCalledWith(result.kind)
  })
})

describe("NodePalette tour anchors", () => {
  afterEach(() => {
    cleanup()
  })

  it("registers palette and item anchors by node kind", () => {
    const anchorRefs: WorkflowEditorAnchorRefs = { current: {} }
    const definitions = [evaluator, result, setVariable]

    render(
      <WorkflowStoreProvider definitions={definitions}>
        <NodePalette anchorRefs={anchorRefs} onAddNode={vi.fn()} />
      </WorkflowStoreProvider>
    )

    expect(anchorRefs.current.palette).toBe(
      screen.getByRole("complementary", { name: "Node palette" })
    )
    for (const definition of definitions) {
      expect(anchorRefs.current.paletteItems?.[definition.kind]).toBeInstanceOf(
        HTMLElement
      )
    }
  })

  it("removes palette and item anchors on unmount", () => {
    const anchorRefs: WorkflowEditorAnchorRefs = { current: {} }
    const definitions = [evaluator, result, setVariable]
    const view = render(
      <WorkflowStoreProvider definitions={definitions}>
        <NodePalette anchorRefs={anchorRefs} onAddNode={vi.fn()} />
      </WorkflowStoreProvider>
    )

    view.unmount()

    expect(anchorRefs.current.palette).toBeUndefined()
    for (const definition of definitions) {
      expect(anchorRefs.current.paletteItems?.[definition.kind]).toBeUndefined()
    }
  })
})

describe("NodePalette focus when it hides", () => {
  afterEach(() => {
    cleanup()
  })

  interface HarnessProps {
    isOpen: boolean
    quickAddActive?: boolean
    showTrigger?: boolean
  }

  /** The palette inside an editor root, beside the "+" that starts a quick-add. */
  function Harness({
    isOpen,
    quickAddActive = false,
    showTrigger = true,
  }: HarnessProps) {
    return (
      <WorkflowStoreProvider definitions={[result]}>
        <div data-workflow-editor-root="" tabIndex={-1} data-testid="root">
          {showTrigger ? <button type="button">quick-add-trigger</button> : null}
          <button type="button">palette-toggle</button>
          <NodePalette
            onAddNode={vi.fn()}
            isOpen={isOpen}
            quickAddActive={quickAddActive}
          />
        </div>
      </WorkflowStoreProvider>
    )
  }

  const palette = () =>
    screen.getByRole("complementary", { hidden: true, name: "Node palette" })
  const card = () =>
    screen.getByRole("button", {
      hidden: true,
      name: `Add ${result.title} node`,
    })

  function startBorrowedQuickAdd() {
    const view = render(<Harness isOpen={false} />)
    screen.getByRole("button", { name: "quick-add-trigger" }).focus()
    view.rerender(<Harness isOpen quickAddActive />)
    expect(document.activeElement).toBe(palette())
    return view
  }

  it("hands focus back to the element that started the quick add", () => {
    const view = startBorrowedQuickAdd()
    card().focus()

    view.rerender(<Harness isOpen={false} />)

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "quick-add-trigger" })
    )
  })

  it("falls back to the editor root when that element is gone", () => {
    const view = startBorrowedQuickAdd()

    view.rerender(<Harness isOpen={false} showTrigger={false} />)

    expect(document.activeElement).toBe(screen.getByTestId("root"))
  })

  it("leaves focus alone when it is outside the palette as it hides", () => {
    const view = render(<Harness isOpen />)
    const toggle = screen.getByRole("button", { name: "palette-toggle" })
    toggle.focus()

    view.rerender(<Harness isOpen={false} />)

    expect(document.activeElement).toBe(toggle)
  })

  it("keeps focus in a pinned palette once the quick add ends", () => {
    const view = render(<Harness isOpen />)
    view.rerender(<Harness isOpen quickAddActive />)
    card().focus()

    view.rerender(<Harness isOpen />)

    expect(document.activeElement).toBe(card())
  })
})
