// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
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
