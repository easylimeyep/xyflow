// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SetVariableNode } from "./set-variable-node"

const updateNodeConfigField = vi.fn()
let mockNodes: Array<{ id: string; data: { kind: string; config: Record<string, unknown> } }> = []
let mockEdges: [] = []

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock("../components/expression-input", () => ({
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

vi.mock("../expression/variables", () => ({
  buildExpressionVariableCatalog: () => [],
}))

vi.mock("../store", () => ({
  useWorkflowShallowStore: (
    selector: (state: { updateNodeConfigField: typeof updateNodeConfigField }) => unknown
  ) =>
    selector({
      updateNodeConfigField,
    }),
  useWorkflowStore: (
    selector: (state: { history: { present: { nodes: typeof mockNodes; edges: typeof mockEdges } } }) => unknown
  ) =>
    selector({
      history: {
        present: {
          nodes: mockNodes,
          edges: mockEdges,
        },
      },
    }),
}))

function createNodeProps(variableName: string, valueExpression: string): NodeProps {
  return {
    id: "set-variable-1",
    type: "setVariable",
    data: {
      kind: "setVariable",
      label: "Set Variable",
      config: {
        variableName,
        valueExpression,
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

describe("SetVariableNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNodes = [{ id: "set-variable-1", data: { kind: "setVariable", config: { variableName: "myVar" } } }]
    mockEdges = []
  })

  afterEach(() => {
    cleanup()
  })

  it("commits variable name and value expression on blur", () => {
    render(<SetVariableNode {...createNodeProps("myVar", "{{ $input.item.json }}")} />)

    const variableInput = screen.getByDisplayValue("myVar")
    fireEvent.focus(variableInput)
    fireEvent.change(variableInput, { target: { value: "regionName" } })
    fireEvent.blur(variableInput)

    const expressionInput = screen.getByTestId("set-variable-expression-input")
    fireEvent.focus(expressionInput)
    fireEvent.change(expressionInput, { target: { value: "{{ $vars.regionName }}" } })
    fireEvent.blur(expressionInput)

    expect(updateNodeConfigField).toHaveBeenCalledWith("set-variable-1", "variableName", "regionName")
    expect(updateNodeConfigField).toHaveBeenCalledWith(
      "set-variable-1",
      "valueExpression",
      "{{ $vars.regionName }}"
    )
  })

  it("keeps empty expression braces on delayed blur commit", () => {
    vi.useFakeTimers()
    try {
      render(<SetVariableNode {...createNodeProps("myVar", "{{ $input.item.json }}")} />)

      const expressionInput = screen.getByTestId("set-variable-expression-input")
      fireEvent.focus(expressionInput)
      fireEvent.change(expressionInput, { target: { value: "{{}}" } })

      setTimeout(() => {
        fireEvent.blur(expressionInput)
      }, 120)
      vi.advanceTimersByTime(120)

      expect(updateNodeConfigField).toHaveBeenCalledWith(
        "set-variable-1",
        "valueExpression",
        "{{}}"
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it("rejects invalid identifier and shows inline error", () => {
    render(<SetVariableNode {...createNodeProps("myVar", "{{ $input.item.json }}")} />)

    const variableInput = screen.getByDisplayValue("myVar")
    fireEvent.focus(variableInput)
    fireEvent.change(variableInput, { target: { value: "bad name" } })
    fireEvent.blur(variableInput)

    expect(updateNodeConfigField).not.toHaveBeenCalledWith(
      "set-variable-1",
      "variableName",
      "bad name"
    )
    expect(screen.getByText("Variable name must be a valid JavaScript identifier.")).toBeTruthy()
  })

  it("rejects duplicate variable names", () => {
    mockNodes = [
      { id: "set-variable-1", data: { kind: "setVariable", config: { variableName: "myVar" } } },
      { id: "set-variable-2", data: { kind: "setVariable", config: { variableName: "existing" } } },
    ]

    render(<SetVariableNode {...createNodeProps("myVar", "{{ $input.item.json }}")} />)
    const variableInput = screen.getByDisplayValue("myVar")
    fireEvent.focus(variableInput)
    fireEvent.change(variableInput, { target: { value: "existing" } })
    fireEvent.blur(variableInput)

    expect(updateNodeConfigField).not.toHaveBeenCalledWith(
      "set-variable-1",
      "variableName",
      "existing"
    )
    expect(screen.getByText("Variable name must be unique in this workflow.")).toBeTruthy()
  })
})
