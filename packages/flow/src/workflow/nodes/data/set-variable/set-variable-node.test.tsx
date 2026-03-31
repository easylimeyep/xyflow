// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { WorkflowNode } from "../../../types"
import { SetVariableNode } from "./set-variable-node"

const mockUpdateNodeConfig = vi.fn()
const mockIsSetVariableNameUnique = vi.fn()
let mockAllNodes: WorkflowNode[] = []

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
    isSetVariableNameUnique: mockIsSetVariableNameUnique,
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

function createNodeProps(variableName: string, valueExpression: string): NodeProps {
  return {
    id: "set-variable-1",
    type: "setVariable",
    data: {
      kind: "setVariable",
      label: "Set Variable",
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
    mockIsSetVariableNameUnique.mockImplementation((nodeId: string, variableName: string) => {
      const normalizedName = variableName.trim()
      return !mockAllNodes.some((node) => {
        if (node.id === nodeId || node.data.kind !== "setVariable") return false
        const candidateVariableName = node.data.config.variableName
        return typeof candidateVariableName === "string" && candidateVariableName.trim() === normalizedName
      })
    })
    mockAllNodes = [
      {
        id: "set-variable-1",
        type: "setVariable",
        position: { x: 0, y: 0 },
        data: {
          kind: "setVariable",
          label: "Set Variable",
          config: { variableName: "myVar", valueExpression: "" },
        },
      } as WorkflowNode,
    ]
  })

  afterEach(() => {
    cleanup()
  })

  it("commits variable name and value expression on blur", () => {
    render(
      <SetVariableNode {...createNodeProps("myVar", "{{ $input.item.json }}")} />
    )

    const variableInput = screen.getByDisplayValue("myVar")
    fireEvent.focus(variableInput)
    fireEvent.change(variableInput, { target: { value: "regionName" } })
    fireEvent.blur(variableInput)

    const expressionInput = screen.getByTestId("set-variable-expression-input")
    fireEvent.focus(expressionInput)
    fireEvent.change(expressionInput, {
      target: { value: "{{ $vars.regionName }}" },
    })
    fireEvent.blur(expressionInput)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("set-variable-1", {
      kind: "setVariable",
      key: "variableName",
      value: "regionName",
    })
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("set-variable-1", {
      kind: "setVariable",
      key: "valueExpression",
      value: "{{ $vars.regionName }}",
    })
  })

  it("rejects invalid identifier and shows inline error", () => {
    render(
      <SetVariableNode {...createNodeProps("myVar", "{{ $input.item.json }}")} />
    )

    const variableInput = screen.getByDisplayValue("myVar")
    fireEvent.focus(variableInput)
    fireEvent.change(variableInput, { target: { value: "bad name" } })
    fireEvent.blur(variableInput)

    expect(mockUpdateNodeConfig).not.toHaveBeenCalledWith(
      "set-variable-1",
      expect.objectContaining({
        kind: "setVariable",
        key: "variableName",
        value: "bad name",
      })
    )
    expect(
      screen.getByText("Variable name must be a valid JavaScript identifier.")
    ).toBeTruthy()
  })

  it("rejects duplicate variable names", () => {
    mockAllNodes = [
      {
        id: "set-variable-1",
        type: "setVariable",
        position: { x: 0, y: 0 },
        data: {
          kind: "setVariable",
          label: "Set Variable",
          config: { variableName: "myVar", valueExpression: "" },
        },
      } as WorkflowNode,
      {
        id: "set-variable-2",
        type: "setVariable",
        position: { x: 200, y: 0 },
        data: {
          kind: "setVariable",
          label: "Set Variable 2",
          config: { variableName: "existing", valueExpression: "" },
        },
      } as WorkflowNode,
    ]

    render(
      <SetVariableNode {...createNodeProps("myVar", "{{ $input.item.json }}")} />
    )
    const variableInput = screen.getByDisplayValue("myVar")
    fireEvent.focus(variableInput)
    fireEvent.change(variableInput, { target: { value: "existing" } })
    fireEvent.blur(variableInput)

    expect(mockUpdateNodeConfig).not.toHaveBeenCalledWith(
      "set-variable-1",
      expect.objectContaining({
        kind: "setVariable",
        key: "variableName",
        value: "existing",
      })
    )
    expect(
      screen.getByText("Variable name must be unique in this workflow.")
    ).toBeTruthy()
  })
})
