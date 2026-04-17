// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ExtractorNode } from "./extractor-node"

const mockUpdateNodeConfig = vi.fn()

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock("../../shared/use-node-store-data", () => ({
  useNodeStoreData: () => ({
    updateNodeConfig: mockUpdateNodeConfig,
  }),
}))

vi.mock("../../output-quick-add-affordance/output-quick-add-affordance", () => ({
  OutputQuickAddAffordance: () => null,
}))

function createNodeProps(
  tokenNumber: number,
  extractExpression: string,
  unlimited = false
): NodeProps {
  return {
    id: "extractor-node-1",
    type: "extractor",
    data: {
      kind: "extractor",
      label: "Extractor",
      config: {
        tokenNumber,
        extractExpression,
        unlimited,
      },
    },
    selected: false,
    dragging: false,
    zIndex: 1,
    selectable: true,
    deletable: true,
    draggable: true,
    isConnectable: true,
    sourcePosition: undefined,
    targetPosition: undefined,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  }
}

describe("ExtractorNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("commits token number as non-negative integer on blur", () => {
    render(<ExtractorNode {...createNodeProps(0, "myVar")} />)

    const tokenNumberInput = screen.getByDisplayValue("1")
    fireEvent.focus(tokenNumberInput)
    fireEvent.change(tokenNumberInput, { target: { value: "42" } })
    fireEvent.blur(tokenNumberInput)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("extractor-node-1", {
      kind: "extractor",
      key: "tokenNumber",
      value: 42,
    })
  })

  it("renders Label input independently from node title", () => {
    render(<ExtractorNode {...createNodeProps(3, "myVar")} />)

    const labelInput = screen.getByPlaceholderText("myVar")
    expect(screen.getByText("Extractor")).toBeDefined()
    expect(labelInput).toBeDefined()
    expect((labelInput as HTMLInputElement).value).toBe("myVar")
  })

  it("commits Label via updateNodeConfig on blur", () => {
    render(<ExtractorNode {...createNodeProps(3, "myVar")} />)

    const labelInput = screen.getByPlaceholderText("myVar")
    fireEvent.focus(labelInput)
    fireEvent.change(labelInput, {
      target: { value: "newVar" },
    })
    fireEvent.blur(labelInput)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("extractor-node-1", {
      kind: "extractor",
      key: "extractExpression",
      value: "newVar",
    })
  })

  it("shows error and does not commit for invalid JS identifier", () => {
    render(<ExtractorNode {...createNodeProps(3, "myVar")} />)

    const labelInput = screen.getByPlaceholderText("myVar")
    fireEvent.focus(labelInput)
    fireEvent.change(labelInput, {
      target: { value: "my var!" },
    })
    fireEvent.blur(labelInput)

    expect(mockUpdateNodeConfig).not.toHaveBeenCalledWith("extractor-node-1", {
      kind: "extractor",
      key: "extractExpression",
      value: "my var!",
    })
    expect(screen.getByText("Label must be a valid JavaScript identifier.")).toBeDefined()
  })

  it("toggles unlimited flag", () => {
    render(<ExtractorNode {...createNodeProps(3, "myVar", false)} />)

    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("extractor-node-1", {
      kind: "extractor",
      key: "unlimited",
      value: true,
    })
  })
})
