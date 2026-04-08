// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { InlineExpressionNode } from "./inline-expression-node"

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
    isSetVariableNameUnique: () => true,
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
      data-testid="inline-expression-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

vi.mock("../../output-quick-add-affordance/output-quick-add-affordance", () => ({
  OutputQuickAddAffordance: () => null,
}))

function createNodeProps(template: string): NodeProps {
  return {
    id: "inline-node-1",
    type: "inlineExpression",
    data: {
      kind: "inlineExpression",
      label: "Inline Node",
      config: { template },
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

describe("InlineExpressionNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("forwards ExpressionInput changes to node config", () => {
    render(<InlineExpressionNode {...createNodeProps("{{ $input.item.json }}")} />)

    const input = screen.getByTestId("inline-expression-input")
    fireEvent.change(input, { target: { value: "{{ $input.item.json.name }}" } })

    expect(mockUpdateNodeConfig).toHaveBeenCalledTimes(1)
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: "{{ $input.item.json.name }}",
    })
  })

  it("uses inlineExpression template key for updates", () => {
    render(<InlineExpressionNode {...createNodeProps("{{ $input.item.json }}")} />)

    const input = screen.getByTestId("inline-expression-input")
    fireEvent.change(input, { target: { value: "{{ $input.item.json.id }}" } })

    expect(mockUpdateNodeConfig).toHaveBeenCalledTimes(1)
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: "{{ $input.item.json.id }}",
    })
  })

  it("syncs draft from store when not focused", () => {
    const rendered = render(
      <InlineExpressionNode {...createNodeProps("{{ old }}")} />
    )

    const input = screen.getByTestId("inline-expression-input") as HTMLInputElement
    expect(input.value).toBe("{{ old }}")

    rendered.rerender(<InlineExpressionNode {...createNodeProps("{{ new }}")} />)

    expect(
      (screen.getByTestId("inline-expression-input") as HTMLInputElement).value
    ).toBe("{{ new }}")
  })
})
