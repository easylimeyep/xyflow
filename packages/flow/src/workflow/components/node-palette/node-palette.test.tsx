// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { evaluator } from "../../nodes/logic/evaluator/definition"
import { result } from "../../nodes/logic/result/definition"
import { setVariable } from "../../nodes/data/set-variable/definition"
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
