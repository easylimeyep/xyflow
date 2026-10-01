// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { JsonSetterNode } from "./component"

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
      data-testid="json-setter-expression-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

vi.mock(
  "../../output-quick-add-affordance/output-quick-add-affordance",
  () => ({
    OutputQuickAddAffordance: () => null,
  })
)

function createNodeProps(label: string, appendInput = false): NodeProps {
  return {
    id: "json-setter-1",
    type: "jsonSetter",
    data: {
      kind: "jsonSetter",
      label,
      config: {
        variableName: "myVar",
        variableType: "value",
        valueExpression: "",
        clear: false,
        appendInput,
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

describe("JsonSetterNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("renders the Setter controls and falls back to the JSON Setter title", () => {
    render(<JsonSetterNode {...createNodeProps("")} />)

    expect(screen.getByText("JSON Setter")).toBeDefined()
    expect(screen.getByPlaceholderText("myVar")).toBeDefined()
    expect(screen.getByLabelText("Variable type")).toBeDefined()
    expect(screen.getByTestId("json-setter-expression-input")).toBeDefined()
    expect(screen.getByLabelText("Clear")).toBeDefined()
    expect(screen.getByLabelText("Append input")).toBeDefined()
  })

  it("commits Setter keys under the jsonSetter kind", () => {
    render(<JsonSetterNode {...createNodeProps("Json")} />)

    fireEvent.click(screen.getByLabelText("Clear"))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("json-setter-1", {
      kind: "jsonSetter",
      key: "clear",
      value: true,
    })
  })

  it("toggles appendInput on", () => {
    render(<JsonSetterNode {...createNodeProps("Json", false)} />)

    fireEvent.click(screen.getByLabelText("Append input"))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("json-setter-1", {
      kind: "jsonSetter",
      key: "appendInput",
      value: true,
    })
  })

  it("toggles appendInput off", () => {
    render(<JsonSetterNode {...createNodeProps("Json", true)} />)

    fireEvent.click(screen.getByLabelText("Append input"))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("json-setter-1", {
      kind: "jsonSetter",
      key: "appendInput",
      value: false,
    })
  })
})
