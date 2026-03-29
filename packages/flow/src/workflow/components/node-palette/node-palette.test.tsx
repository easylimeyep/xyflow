// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { workflowNodeRegistry } from "../../node-registry"
import { WORKFLOW_NODE_KINDS } from "../../types"
import { NodePalette } from "./node-palette"

describe("NodePalette", () => {
  it("renders all node kinds from workflow registry order", () => {
    render(<NodePalette onAddNode={vi.fn()} />)

    WORKFLOW_NODE_KINDS.forEach((kind) => {
      expect(screen.getByText(workflowNodeRegistry[kind].title)).toBeTruthy()
    })
  })

  it("delegates click to onAddNode with selected kind", () => {
    const onAddNode = vi.fn()
    render(<NodePalette onAddNode={onAddNode} />)

    const triggerButtons = screen.getAllByRole("button", { name: /Trigger/i })
    triggerButtons.forEach((button) => {
      fireEvent.click(button)
    })

    expect(onAddNode).toHaveBeenCalledWith("trigger")
  })
})
