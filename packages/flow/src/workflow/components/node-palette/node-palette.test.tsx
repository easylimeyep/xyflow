// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { WORKFLOW_NODE_KINDS } from "../../node-registry"
import type { WorkflowEditorAnchorRefs } from "../../tour"
import { NodePalette } from "./node-palette"

describe("NodePalette tour anchors", () => {
  afterEach(() => {
    cleanup()
  })

  it("registers palette and item anchors by node kind", () => {
    const anchorRefs: WorkflowEditorAnchorRefs = { current: {} }

    render(<NodePalette anchorRefs={anchorRefs} onAddNode={vi.fn()} />)

    expect(anchorRefs.current.palette).toBe(
      screen.getByRole("complementary", { name: "Node palette" })
    )
    for (const kind of WORKFLOW_NODE_KINDS) {
      expect(anchorRefs.current.paletteItems?.[kind]).toBeInstanceOf(
        HTMLElement
      )
    }
  })

  it("removes palette and item anchors on unmount", () => {
    const anchorRefs: WorkflowEditorAnchorRefs = { current: {} }
    const view = render(
      <NodePalette anchorRefs={anchorRefs} onAddNode={vi.fn()} />
    )

    view.unmount()

    expect(anchorRefs.current.palette).toBeUndefined()
    for (const kind of WORKFLOW_NODE_KINDS) {
      expect(anchorRefs.current.paletteItems?.[kind]).toBeUndefined()
    }
  })
})
