// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { InlineExpressionNode } from "./component"

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

vi.mock("../../node-shell/node-shell", () => ({
  NodeShell: ({
    showTarget = true,
    headerAccessory,
    children,
  }: {
    showTarget?: boolean
    headerAccessory?: ReactNode
    children?: ReactNode
  }) => (
    <div data-testid="node-shell" data-show-target={String(showTarget)}>
      {headerAccessory}
      {children}
    </div>
  ),
}))

vi.mock("../../../components/expression-input", () => ({
  ExpressionInput: ({
    value,
    placeholder,
    onChange,
    onLiveChange,
  }: {
    value: string
    placeholder?: string
    onChange: (nextValue: string) => void
    onLiveChange?: (nextValue: string) => void
  }) => (
    <input
      data-testid="inline-expression-input"
      placeholder={placeholder}
      value={value}
      onChange={(event) => {
        onLiveChange?.(event.target.value)
        onChange(event.target.value)
      }}
    />
  ),
}))

vi.mock(
  "../../output-quick-add-affordance/output-quick-add-affordance",
  () => ({
    OutputQuickAddAffordance: () => null,
  })
)

function createNodeProps(
  template: string[] = [],
  overrides: Partial<NodeProps> = {}
): NodeProps {
  return {
    id: "inline-node-1",
    type: "inlineExpression",
    data: {
      kind: "inlineExpression",
      label: "Inline Node",
      config: {
        template,
        isRoot: false,
        repeatable: false,
        caseSensitive: false,
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
    ...overrides,
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
    render(
      <InlineExpressionNode {...createNodeProps(["{{ $input.item.json }}"])} />
    )

    const input = screen.getByTestId("inline-expression-input")
    fireEvent.change(input, {
      target: { value: "{{ $input.item.json.name }}" },
    })

    expect(mockUpdateNodeConfig).toHaveBeenCalledTimes(1)
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: ["{{ $input.item.json.name }}"],
    })
  })

  it("uses inlineExpression template key for updates", () => {
    render(
      <InlineExpressionNode {...createNodeProps(["{{ $input.item.json }}"])} />
    )

    const input = screen.getByTestId("inline-expression-input")
    fireEvent.change(input, { target: { value: "{{ $input.item.json.id }}" } })

    expect(mockUpdateNodeConfig).toHaveBeenCalledTimes(1)
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: ["{{ $input.item.json.id }}"],
    })
  })

  it("syncs draft from store when not focused", () => {
    const rendered = render(
      <InlineExpressionNode {...createNodeProps(["{{ old }}"])} />
    )

    const input = screen.getByTestId(
      "inline-expression-input"
    ) as HTMLInputElement
    expect(input.value).toBe("{{ old }}")

    rendered.rerender(
      <InlineExpressionNode {...createNodeProps(["{{ new }}"])} />
    )

    expect(
      (screen.getByTestId("inline-expression-input") as HTMLInputElement).value
    ).toBe("{{ new }}")
  })

  it("replaces stale live token drafts when committed tokens change", () => {
    const rendered = render(
      <InlineExpressionNode {...createNodeProps(["lead"])} />
    )

    fireEvent.change(screen.getByTestId("inline-expression-input"), {
      target: { value: "lead score" },
    })
    expect(screen.getByText(/Tokens cannot contain spaces/i)).toBeTruthy()

    rendered.rerender(<InlineExpressionNode {...createNodeProps(["email"])} />)

    expect(
      (screen.getByTestId("inline-expression-input") as HTMLInputElement).value
    ).toBe("email")
    expect(screen.queryByText(/Tokens cannot contain spaces/i)).toBeNull()

    rendered.rerender(<InlineExpressionNode {...createNodeProps(["lead"])} />)

    expect(
      (screen.getByTestId("inline-expression-input") as HTMLInputElement).value
    ).toBe("lead")
    expect(screen.queryByText(/Tokens cannot contain spaces/i)).toBeNull()
  })

  it("updates isRoot config when Root checkbox toggles", () => {
    render(
      <InlineExpressionNode {...createNodeProps(["{{ $input.item.json }}"])} />
    )

    fireEvent.click(screen.getByRole("checkbox", { name: /Root/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "isRoot",
      value: true,
    })
  })

  it("renders Repeatable checkbox below tokens input", () => {
    render(
      <InlineExpressionNode {...createNodeProps(["{{ $input.item.json }}"])} />
    )

    const input = screen.getByTestId("inline-expression-input")
    const repeatableCheckbox = screen.getByRole("checkbox", {
      name: /Repeatable/i,
    })

    expect(
      input.compareDocumentPosition(repeatableCheckbox) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("updates repeatable config when Repeatable checkbox toggles", () => {
    render(
      <InlineExpressionNode {...createNodeProps(["{{ $input.item.json }}"])} />
    )

    fireEvent.click(screen.getByRole("checkbox", { name: /Repeatable/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "repeatable",
      value: true,
    })
  })

  it("renders Case sensitive checkbox before tokens input", () => {
    render(
      <InlineExpressionNode {...createNodeProps(["{{ $input.item.json }}"])} />
    )

    const input = screen.getByTestId("inline-expression-input")
    const caseSensitiveCheckbox = screen.getByRole("checkbox", {
      name: /Case sensitive/i,
    })

    expect(
      caseSensitiveCheckbox.compareDocumentPosition(input) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("updates caseSensitive config when Case sensitive checkbox toggles", () => {
    render(
      <InlineExpressionNode {...createNodeProps(["{{ $input.item.json }}"])} />
    )

    fireEvent.click(screen.getByRole("checkbox", { name: /Case sensitive/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "caseSensitive",
      value: true,
    })
  })

  it("hides target handle when node is root", () => {
    const rootNodeProps = createNodeProps(["{{ $input.item.json }}"])
    rootNodeProps.data = {
      kind: "inlineExpression",
      label: "Inline Node",
      config: {
        template: ["{{ $input.item.json }}"],
        isRoot: true,
        repeatable: false,
        caseSensitive: false,
      },
    }

    render(<InlineExpressionNode {...rootNodeProps} />)

    expect(
      screen.getByTestId("node-shell").getAttribute("data-show-target")
    ).toBe("false")
  })

  it("renders one empty input row when template array is empty", () => {
    render(<InlineExpressionNode {...createNodeProps([])} />)

    expect(screen.getAllByTestId("inline-expression-input")).toHaveLength(1)
    expect(
      (screen.getByTestId("inline-expression-input") as HTMLInputElement).value
    ).toBe("")
    expect(screen.getByPlaceholderText("token")).toBeDefined()
  })

  it("appends a new token row from the add button", () => {
    render(<InlineExpressionNode {...createNodeProps(["{{ first }}"])} />)

    fireEvent.click(screen.getByRole("button", { name: /Add token/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: ["{{ first }}"],
    })
    expect(screen.getAllByTestId("inline-expression-input")).toHaveLength(2)
  })

  it("renders the add button below token rows", () => {
    render(<InlineExpressionNode {...createNodeProps(["{{ first }}"])} />)

    const addButton = screen.getByRole("button", { name: /Add token/i })
    const addRow = screen.getByTestId("keyword-token-add-row")
    const tokenRows = screen.getAllByTestId("keyword-token-row")

    expect(addRow.contains(addButton)).toBe(true)
    expect(tokenRows.some((row) => row.contains(addButton))).toBe(false)
  })

  it("keeps empty visual rows out of config when adding from the empty visual state", () => {
    render(<InlineExpressionNode {...createNodeProps([])} />)

    fireEvent.click(screen.getByRole("button", { name: /Add token/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: [],
    })
    expect(screen.getAllByTestId("inline-expression-input")).toHaveLength(2)
  })

  it("persists an empty array when clearing the only token row", () => {
    render(<InlineExpressionNode {...createNodeProps(["email"])} />)

    fireEvent.change(screen.getByTestId("inline-expression-input"), {
      target: { value: "" },
    })

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: [],
    })
    expect(screen.getAllByTestId("inline-expression-input")).toHaveLength(1)
  })

  it("persists only non-empty keyword tokens in order", () => {
    render(<InlineExpressionNode {...createNodeProps(["email", "phone"])} />)

    const inputs = screen.getAllByTestId("inline-expression-input")
    expect(inputs).toHaveLength(2)

    fireEvent.change(inputs[0]!, {
      target: { value: "" },
    })

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: ["phone"],
    })
  })

  it("removes a token row from the hover delete affordance", () => {
    render(
      <InlineExpressionNode
        {...createNodeProps(["{{ first }}", "{{ second }}"])}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Delete token 2/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: ["{{ first }}"],
    })
  })

  it("renders delete controls inside token rows without an action gutter", () => {
    render(
      <InlineExpressionNode
        {...createNodeProps(["{{ first }}", "{{ second }}"])}
      />
    )

    const deleteButtons = screen.getAllByRole("button", {
      name: /Delete token/i,
    })
    const tokenRows = screen.getAllByTestId("keyword-token-row")

    expect(deleteButtons).toHaveLength(2)
    expect(screen.queryByTestId("keyword-token-row-action-gutter")).toBeNull()
    deleteButtons.forEach((button, index) => {
      expect(tokenRows[index]?.contains(button)).toBe(true)
    })
  })

  it("hides token delete affordances when node interactivity is disabled", () => {
    render(
      <InlineExpressionNode
        {...createNodeProps(["{{ first }}", "{{ second }}"], {
          draggable: false,
          selectable: false,
          isConnectable: false,
        })}
      />
    )

    expect(screen.queryByRole("button", { name: /Delete token 1/i })).toBeNull()
    expect(screen.queryByRole("button", { name: /Delete token 2/i })).toBeNull()
    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()
  })

  it("removing the final token row collapses to the empty visual state", () => {
    render(<InlineExpressionNode {...createNodeProps(["{{ only }}"])} />)

    fireEvent.click(screen.getByRole("button", { name: /Delete token 1/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: [],
    })
  })

  it("rejects literal token rows containing spaces", () => {
    render(<InlineExpressionNode {...createNodeProps(["email"])} />)

    fireEvent.change(screen.getByTestId("inline-expression-input"), {
      target: { value: "email address" },
    })

    expect(screen.getByText(/Tokens cannot contain spaces/i)).toBeTruthy()
    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()
  })

  it("persists a single variable expression token", () => {
    render(<InlineExpressionNode {...createNodeProps(["email"])} />)

    fireEvent.change(screen.getByTestId("inline-expression-input"), {
      target: { value: "{{ $input.item.json.email }}" },
    })

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: ["{{ $input.item.json.email }}"],
    })
  })

  it("rejects mixed literal and variable token rows", () => {
    render(<InlineExpressionNode {...createNodeProps(["email"])} />)

    fireEvent.change(screen.getByTestId("inline-expression-input"), {
      target: { value: "email {{ $input.item.json.email }}" },
    })

    expect(screen.getByText(/Tokens cannot contain spaces/i)).toBeTruthy()
    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()
  })

  it("renders existing invalid token rows so authors can correct them", () => {
    render(<InlineExpressionNode {...createNodeProps(["email address"])} />)

    expect(
      (screen.getByTestId("inline-expression-input") as HTMLInputElement).value
    ).toBe("email address")
    expect(screen.getByText(/Tokens cannot contain spaces/i)).toBeTruthy()

    fireEvent.change(screen.getByTestId("inline-expression-input"), {
      target: { value: "email" },
    })

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("inline-node-1", {
      kind: "inlineExpression",
      key: "template",
      value: ["email"],
    })
  })
})
