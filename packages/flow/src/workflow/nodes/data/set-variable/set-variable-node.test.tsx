// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SetVariableNode } from "./set-variable-node"

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
      data-testid="set-variable-expression-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

vi.mock("../../output-quick-add-affordance/output-quick-add-affordance", () => ({
  OutputQuickAddAffordance: () => null,
}))

function createNodeProps(valueExpression: string): NodeProps {
  return {
    id: "set-variable-1",
    type: "setVariable",
    data: {
      kind: "setVariable",
      label: "Setter",
      config: { valueExpression },
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

describe("SetVariableNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("commits value expression on change", () => {
    render(<SetVariableNode {...createNodeProps("{{ myVar }}")} />)

    const expressionInput = screen.getByTestId("set-variable-expression-input")
    fireEvent.change(expressionInput, { target: { value: "{{ newVar }}" } })

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("set-variable-1", {
      kind: "setVariable",
      key: "valueExpression",
      value: "{{ newVar }}",
    })
  })

  it("does not render a variable name input field", () => {
    render(<SetVariableNode {...createNodeProps("")} />)

    expect(screen.queryByPlaceholderText("myVar")).toBeNull()
    expect(screen.queryByText("Variable name")).toBeNull()
  })
})
