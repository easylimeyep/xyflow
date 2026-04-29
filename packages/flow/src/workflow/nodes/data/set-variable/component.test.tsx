// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SetVariableNode } from "./component"

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

function createNodeProps(label: string, variableName: string, valueExpression: string): NodeProps {
  return {
    id: "set-variable-1",
    type: "setVariable",
    data: {
      kind: "setVariable",
      label,
      config: { variableName, valueExpression },
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

  it("renders variable name input independently from node title", () => {
    render(<SetVariableNode {...createNodeProps("Setter Title", "myVar", "")} />)

    const nameInput = screen.getByPlaceholderText("myVar")
    expect(screen.getByText("Label")).toBeDefined()
    expect(screen.getByText("Setter Title")).toBeDefined()
    expect(nameInput).toBeDefined()
    expect((nameInput as HTMLInputElement).value).toBe("myVar")
  })

  it("commits variableName via updateNodeConfig on blur", () => {
    render(<SetVariableNode {...createNodeProps("Setter", "myVar", "")} />)

    const nameInput = screen.getByPlaceholderText("myVar")
    fireEvent.focus(nameInput)
    fireEvent.change(nameInput, { target: { value: "newVar" } })
    fireEvent.blur(nameInput)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("set-variable-1", {
      kind: "setVariable",
      key: "variableName",
      value: "newVar",
    })
  })

  it("shows error and does not commit for invalid JS identifier", () => {
    render(<SetVariableNode {...createNodeProps("Setter", "myVar", "")} />)

    const nameInput = screen.getByPlaceholderText("myVar")
    fireEvent.focus(nameInput)
    fireEvent.change(nameInput, { target: { value: "my var!" } })
    fireEvent.blur(nameInput)

    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()
    expect(screen.getByText("Label must be a valid JavaScript identifier.")).toBeDefined()
  })

  it("commits value expression on change", () => {
    render(<SetVariableNode {...createNodeProps("Setter", "myVar", "{{ myVar }}")} />)

    const expressionInput = screen.getByTestId("set-variable-expression-input")
    fireEvent.change(expressionInput, { target: { value: "{{ newVar }}" } })

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("set-variable-1", {
      kind: "setVariable",
      key: "valueExpression",
      value: "{{ newVar }}",
    })
  })
})
