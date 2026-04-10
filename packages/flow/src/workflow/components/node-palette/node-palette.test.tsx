// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { nodeRegistry, WORKFLOW_NODE_KINDS } from "../../node-registry/registry"
import { NodePalette } from "./node-palette"

afterEach(() => {
  cleanup()
})

describe("NodePalette", () => {
  it("renders all node kinds from workflow registry order", () => {
    render(<NodePalette onAddNode={vi.fn()} />)

    WORKFLOW_NODE_KINDS.forEach((kind) => {
      expect(screen.getByText(nodeRegistry[kind].title)).toBeTruthy()
    })
  })

  it("delegates click to onAddNode with selected kind", () => {
    const onAddNode = vi.fn()
    render(<NodePalette onAddNode={onAddNode} />)

    const keywordButtons = screen.getAllByRole("button", { name: /Keyword/i })
    keywordButtons.forEach((button) => {
      fireEvent.click(button)
    })

    expect(onAddNode).toHaveBeenCalledWith("inlineExpression")
  })

  it("marks palette as closed when isOpen is false", () => {
    render(<NodePalette onAddNode={vi.fn()} isOpen={false} />)

    const aside = screen.getByLabelText("Node palette")
    expect(aside.getAttribute("data-state")).toBe("closed")
    expect(aside.getAttribute("aria-hidden")).toBe("true")
  })
})
