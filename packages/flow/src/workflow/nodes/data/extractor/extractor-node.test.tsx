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
    expressionVariables: [],
    updateNodeConfig: mockUpdateNodeConfig,
  }),
}))

vi.mock("../../../components/expression-input", () => ({
  ExpressionInput: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (nextValue: string) => void
  }) => (
    <input
      data-testid="extractor-expression-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
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
    render(<ExtractorNode {...createNodeProps(0, "{{ $input.item.json }}")} />)

    const tokenNumberInput = screen.getByDisplayValue("0")
    fireEvent.focus(tokenNumberInput)
    fireEvent.change(tokenNumberInput, { target: { value: "42" } })
    fireEvent.blur(tokenNumberInput)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("extractor-node-1", {
      kind: "extractor",
      key: "tokenNumber",
      value: 42,
    })
  })

  it("commits extract expression on blur", () => {
    render(<ExtractorNode {...createNodeProps(3, "{{ $input.item.json }}")} />)

    const expressionInput = screen.getByTestId("extractor-expression-input")
    fireEvent.focus(expressionInput)
    fireEvent.change(expressionInput, {
      target: { value: "{{ $node(\"Trigger\").item.json.eventName }}" },
    })
    fireEvent.blur(expressionInput)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("extractor-node-1", {
      kind: "extractor",
      key: "extractExpression",
      value: "{{ $node(\"Trigger\").item.json.eventName }}",
    })
  })

  it("toggles unlimited flag", () => {
    render(<ExtractorNode {...createNodeProps(3, "{{ $input.item.json }}", false)} />)

    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("extractor-node-1", {
      kind: "extractor",
      key: "unlimited",
      value: true,
    })
  })
})
