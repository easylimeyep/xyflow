// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { NodeProps } from "@xyflow/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PathExtractorNode } from "./component"

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

vi.mock(
  "../../output-quick-add-affordance/output-quick-add-affordance",
  () => ({
    OutputQuickAddAffordance: () => null,
  })
)

function createNodeProps(
  variableLabel: string,
  path: string,
  outputType = "value"
): NodeProps {
  return {
    id: "path-extractor-node-1",
    type: "pathExtractor",
    data: {
      kind: "pathExtractor",
      label: "Path Extractor",
      config: {
        variableLabel,
        path,
        outputType,
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

describe("PathExtractorNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("renders Label and Path inputs independently from node title", () => {
    render(<PathExtractorNode {...createNodeProps("myVar", "user.city")} />)

    expect(screen.getByText("Path Extractor")).toBeDefined()
    const labelInput = screen.getByPlaceholderText("myVar") as HTMLInputElement
    const pathInput = screen.getByPlaceholderText(
      "user.address.city"
    ) as HTMLInputElement
    expect(labelInput.value).toBe("myVar")
    expect(pathInput.value).toBe("user.city")
  })

  it("commits Label via updateNodeConfig on blur", () => {
    render(<PathExtractorNode {...createNodeProps("myVar", "user.city")} />)

    const labelInput = screen.getByPlaceholderText("myVar")
    fireEvent.focus(labelInput)
    fireEvent.change(labelInput, { target: { value: "newVar" } })
    fireEvent.blur(labelInput)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("path-extractor-node-1", {
      kind: "pathExtractor",
      key: "variableLabel",
      value: "newVar",
    })
  })

  it("shows error and does not commit for invalid JS identifier label", () => {
    render(<PathExtractorNode {...createNodeProps("myVar", "user.city")} />)

    const labelInput = screen.getByPlaceholderText("myVar")
    fireEvent.focus(labelInput)
    fireEvent.change(labelInput, { target: { value: "my var!" } })
    fireEvent.blur(labelInput)

    expect(mockUpdateNodeConfig).not.toHaveBeenCalledWith(
      "path-extractor-node-1",
      { kind: "pathExtractor", key: "variableLabel", value: "my var!" }
    )
    expect(
      screen.getByText("Label must be a valid JavaScript identifier.")
    ).toBeDefined()
  })

  it("commits Path via updateNodeConfig on blur", () => {
    render(<PathExtractorNode {...createNodeProps("myVar", "user.city")} />)

    const pathInput = screen.getByPlaceholderText("user.address.city")
    fireEvent.focus(pathInput)
    fireEvent.change(pathInput, { target: { value: "items[0].name" } })
    fireEvent.blur(pathInput)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("path-extractor-node-1", {
      kind: "pathExtractor",
      key: "path",
      value: "items[0].name",
    })
  })

  it("does not commit Path when value is unchanged", () => {
    render(<PathExtractorNode {...createNodeProps("myVar", "user.city")} />)

    const pathInput = screen.getByPlaceholderText("user.address.city")
    fireEvent.focus(pathInput)
    fireEvent.blur(pathInput)

    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()
  })

  it("commits output type via updateNodeConfig on change", async () => {
    const user = userEvent.setup()
    render(<PathExtractorNode {...createNodeProps("myVar", "user.city")} />)

    const outputSelect = screen.getByLabelText("Expected out")
    await user.click(outputSelect)
    await user.click(await screen.findByRole("option", { name: "array value" }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("path-extractor-node-1", {
      kind: "pathExtractor",
      key: "outputType",
      value: "arrayValue",
    })
  })
})
