// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { InlineExpressionNode } from "./inline-expression-node"

const updateNodeConfigField = vi.fn()

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
      data-testid="inline-expression-input"
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
    selector: (state: { history: { present: { nodes: []; edges: [] } } }) => unknown
  ) =>
    selector({
      history: {
        present: {
          nodes: [],
          edges: [],
        },
      },
    }),
}))

function createNodeProps(template: string): NodeProps {
  return {
    id: "inline-node-1",
    type: "inlineExpression",
    data: {
      kind: "inlineExpression",
      label: "Inline Node",
      config: {
        template,
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

describe("InlineExpressionNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("commits template only on blur", () => {
    render(<InlineExpressionNode {...createNodeProps("{{ $input.item.json }}")} />)

    const input = screen.getByTestId("inline-expression-input")
    fireEvent.change(input, { target: { value: "{{ $input.item.json.name }}" } })

    expect(updateNodeConfigField).not.toHaveBeenCalled()

    fireEvent.blur(input)

    expect(updateNodeConfigField).toHaveBeenCalledTimes(1)
    expect(updateNodeConfigField).toHaveBeenCalledWith(
      "inline-node-1",
      "template",
      "{{ $input.item.json.name }}"
    )
  })

  it("commits template on Enter key", () => {
    render(<InlineExpressionNode {...createNodeProps("{{ $input.item.json }}")} />)

    const input = screen.getByTestId("inline-expression-input")
    fireEvent.change(input, { target: { value: "{{ $input.item.json.id }}" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(updateNodeConfigField).toHaveBeenCalledTimes(1)
    expect(updateNodeConfigField).toHaveBeenCalledWith(
      "inline-node-1",
      "template",
      "{{ $input.item.json.id }}"
    )
  })

  it("syncs draft from store when not focused", () => {
    const rendered = render(<InlineExpressionNode {...createNodeProps("{{ old }}")} />)

    const input = screen.getByTestId("inline-expression-input") as HTMLInputElement
    expect(input.value).toBe("{{ old }}")

    rendered.rerender(<InlineExpressionNode {...createNodeProps("{{ new }}")} />)

    expect((screen.getByTestId("inline-expression-input") as HTMLInputElement).value).toBe(
      "{{ new }}"
    )
  })
})
