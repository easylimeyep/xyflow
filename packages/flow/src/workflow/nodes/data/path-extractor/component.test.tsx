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

// The select's choices come from the store (`runtime.nodeOptions`); this suite
// renders the node without a provider, so the hook is stubbed to hand back the
// built-in list the component passes as its fallback — unless a test stands in
// its own host options.
let mockHostOptions: { value: string; label: string }[] | null = null

vi.mock("../../shared/use-node-select-options", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../shared/use-node-select-options")
    >()

  return {
    ...actual,
    useNodeSelectOptions: (
      _kind: string,
      _configKey: string,
      fallbackOptions: readonly { value: string; label: string }[]
    ) => mockHostOptions ?? fallbackOptions,
  }
})

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

function createNodeProps(path: string, outputType = "value"): NodeProps {
  return {
    id: "path-extractor-node-1",
    type: "pathExtractor",
    data: {
      kind: "pathExtractor",
      label: "Path Extractor",
      config: {
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
    mockHostOptions = null
  })

  afterEach(() => {
    cleanup()
  })

  it("renders the Path input and the node title, and carries no Label field", () => {
    render(<PathExtractorNode {...createNodeProps("user.city")} />)

    expect(screen.getByText("Path Extractor")).toBeDefined()
    const pathInput = screen.getByPlaceholderText(
      "user.address.city"
    ) as HTMLInputElement
    expect(pathInput.value).toBe("user.city")
    expect(screen.queryByPlaceholderText("myVar")).toBeNull()
    expect(screen.queryByText("Label")).toBeNull()
  })

  it("commits Path via updateNodeConfig on blur", () => {
    render(<PathExtractorNode {...createNodeProps("user.city")} />)

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
    render(<PathExtractorNode {...createNodeProps("user.city")} />)

    const pathInput = screen.getByPlaceholderText("user.address.city")
    fireEvent.focus(pathInput)
    fireEvent.blur(pathInput)

    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()
  })

  it("commits output type via updateNodeConfig on change", async () => {
    const user = userEvent.setup()
    render(<PathExtractorNode {...createNodeProps("user.city")} />)

    const outputSelect = screen.getByLabelText("Expected out")
    await user.click(outputSelect)
    await user.click(await screen.findByRole("option", { name: "array value" }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("path-extractor-node-1", {
      kind: "pathExtractor",
      key: "outputType",
      value: "arrayValue",
    })
  })

  it("disables the select and keeps the stored value on empty host options", async () => {
    // What a host hands over when its option request came back empty or
    // failed: nothing to choose from, and the saved value must survive.
    mockHostOptions = []
    const user = userEvent.setup()
    render(
      <PathExtractorNode {...createNodeProps("user.city", "arrayObject")} />
    )

    const outputSelect = screen.getByLabelText("Expected out")
    expect(outputSelect.getAttribute("disabled")).not.toBeNull()
    expect(outputSelect.textContent).toContain("arrayObject")

    await user.click(outputSelect)

    expect(screen.queryByRole("option")).toBeNull()
    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()
  })
})
