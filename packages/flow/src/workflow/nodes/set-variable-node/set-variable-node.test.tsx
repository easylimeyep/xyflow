// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { WorkflowNode } from "../../types"
import type { SetVariableNodeProps } from "./set-variable-node"
import { SetVariableNode } from "./set-variable-node"

const updateNodeConfigField = vi.fn()
let mockNodes: WorkflowNode[] = []

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock("../output-quick-add-affordance/output-quick-add-affordance", () => ({
  OutputQuickAddAffordance: () => null,
}))

vi.mock("../../components/expression-input", () => ({
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

function createNodeProps(variableName: string, valueExpression: string): SetVariableNodeProps {
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
    expressionVariables: [],
    onUpdateConfigField: updateNodeConfigField,
    allNodes: mockNodes,
  }
}

describe("SetVariableNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNodes = [
      {
        id: "set-variable-1",
        type: "setVariable",
        position: { x: 0, y: 0 },
        data: { kind: "setVariable", label: "Set Variable", config: { variableName: "myVar", valueExpression: "" } },
      } as WorkflowNode,
    ]
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

    expect(updateNodeConfigField).toHaveBeenCalledWith("set-variable-1", {
      kind: "setVariable",
      key: "variableName",
      value: "regionName",
    })
    expect(updateNodeConfigField).toHaveBeenCalledWith(
      "set-variable-1",
      {
        kind: "setVariable",
        key: "valueExpression",
        value: "{{ $vars.regionName }}",
      }
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
        {
          kind: "setVariable",
          key: "valueExpression",
          value: "{{}}",
        }
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
      expect.objectContaining({
        kind: "setVariable",
        key: "variableName",
        value: "bad name",
      })
    )
    expect(screen.getByText("Variable name must be a valid JavaScript identifier.")).toBeTruthy()
  })

  it("rejects duplicate variable names", () => {
    mockNodes = [
      {
        id: "set-variable-1",
        type: "setVariable",
        position: { x: 0, y: 0 },
        data: { kind: "setVariable", label: "Set Variable", config: { variableName: "myVar", valueExpression: "" } },
      } as WorkflowNode,
      {
        id: "set-variable-2",
        type: "setVariable",
        position: { x: 200, y: 0 },
        data: { kind: "setVariable", label: "Set Variable 2", config: { variableName: "existing", valueExpression: "" } },
      } as WorkflowNode,
    ]

    render(<SetVariableNode {...createNodeProps("myVar", "{{ $input.item.json }}")} />)
    const variableInput = screen.getByDisplayValue("myVar")
    fireEvent.focus(variableInput)
    fireEvent.change(variableInput, { target: { value: "existing" } })
    fireEvent.blur(variableInput)

    expect(updateNodeConfigField).not.toHaveBeenCalledWith(
      "set-variable-1",
      expect.objectContaining({
        kind: "setVariable",
        key: "variableName",
        value: "existing",
      })
    )
    expect(screen.getByText("Variable name must be unique in this workflow.")).toBeTruthy()
  })
})
