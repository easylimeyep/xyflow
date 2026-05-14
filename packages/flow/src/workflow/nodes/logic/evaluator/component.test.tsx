// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { WorkflowEvaluatorOperatorOption } from "../../../types"
import { EvaluatorNode } from "./component"

const mockUpdateNodeConfig = vi.fn()

let mockEvaluatorOperators: WorkflowEvaluatorOperatorOption[] = [
  { id: "is equal to", value: "is equal to", requiresTarget: true },
  { id: "is empty", value: "is empty", requiresTarget: false },
]
let mockEnableEvaluatorMultipleConditions = false

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock("@workspace/ui/components/sortable", () => ({
  Sortable: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SortableContent: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  SortableItem: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  SortableItemHandle: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  SortableOverlay: () => null,
}))

vi.mock("../../../components/expression-input", () => ({
  ExpressionInput: ({
    value,
    placeholder,
    onChange,
  }: {
    value: string
    placeholder?: string
    onChange: (value: string) => void
  }) => (
    <input
      aria-label={placeholder ?? "expression-input"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

vi.mock("../../node-shell/node-shell", () => ({
  NodeShell: ({
    title,
    subtitle,
    children,
  }: {
    title: string
    subtitle?: string
    children?: ReactNode
  }) => (
    <div data-testid="node-shell">
      <span>{title}</span>
      <span>{subtitle}</span>
      {children}
    </div>
  ),
}))

vi.mock("../../shared/use-node-store-data", () => ({
  useNodeStoreData: () => ({
    expressionVariables: [],
    evaluatorOperators: mockEvaluatorOperators,
    enableEvaluatorMultipleConditions: mockEnableEvaluatorMultipleConditions,
    updateNodeConfig: mockUpdateNodeConfig,
  }),
}))

function createNodeProps(
  overrides?: Partial<NodeProps["data"] & { config: Record<string, unknown> }>
): NodeProps {
  return {
    id: "evaluator-node-1",
    type: "evaluator",
    data: {
      kind: "evaluator",
      label: "Evaluator",
      config: {
        conditions: [
          {
            id: "condition-1",
            value: "{{ source }}",
            operator: "is equal to",
            targetValue: "{{ target }}",
          },
        ],
        label: "conditionMatched",
        logicalOperator: "and",
        caseSensitive: false,
      },
      ...overrides,
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

describe("EvaluatorNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEvaluatorOperators = [
      { id: "is equal to", value: "is equal to", requiresTarget: true },
      { id: "is empty", value: "is empty", requiresTarget: false },
    ]
    mockEnableEvaluatorMultipleConditions = false
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "00000000-0000-0000-0000-000000000001"
    )
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("renders runtime-provided operator labels and updates the stored operator id", () => {
    mockEvaluatorOperators = [
      { id: "matches", value: "Matches", requiresTarget: true },
      { id: "missing", value: "Is Missing", requiresTarget: false },
    ]

    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                value: "{{ source }}",
                operator: "matches",
                targetValue: "{{ target }}",
              },
            ],
            label: "conditionMatched",
            logicalOperator: "and",
          },
        })}
      />
    )

    const operatorSelect = screen.getByLabelText(
      "Condition operator"
    ) as HTMLSelectElement

    expect(operatorSelect.value).toBe("matches")
    expect(screen.getByRole("option", { name: "Matches" })).toBeTruthy()
    expect(screen.getByRole("option", { name: "Is Missing" })).toBeTruthy()

    fireEvent.change(operatorSelect, { target: { value: "missing" } })

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "conditions",
      value: [
        {
          id: "condition-1",
          value: "{{ source }}",
          operator: "missing",
          targetValue: "{{ target }}",
        },
      ],
    })
  })

  it("updates the editable logical operator with the native select", () => {
    mockEnableEvaluatorMultipleConditions = true

    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                value: "{{ source }}",
                operator: "is equal to",
                targetValue: "{{ target }}",
              },
              {
                id: "condition-2",
                value: "{{ other }}",
                operator: "is empty",
                targetValue: "",
              },
              {
                id: "condition-3",
                value: "{{ final }}",
                operator: "is empty",
                targetValue: "",
              },
            ],
            label: "conditionMatched",
            logicalOperator: "and",
          },
        })}
      />
    )

    const logicalOperatorSelect = screen.getByLabelText(
      "Logical operator"
    ) as HTMLSelectElement

    expect(logicalOperatorSelect.value).toBe("and")
    expect(screen.getByRole("option", { name: "AND" })).toBeTruthy()
    expect(screen.getByRole("option", { name: "OR" })).toBeTruthy()
    expect(screen.getAllByText("AND").length).toBeGreaterThan(1)

    fireEvent.change(logicalOperatorSelect, { target: { value: "or" } })

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "logicalOperator",
      value: "or",
    })
  })

  it("renders Label input independently from node title", () => {
    render(
      <EvaluatorNode
        {...createNodeProps({
          label: "Evaluator Title",
          config: {
            conditions: [
              {
                id: "condition-1",
                value: "{{ source }}",
                operator: "is equal to",
                targetValue: "{{ target }}",
              },
            ],
            label: "conditionMatched",
            logicalOperator: "and",
            caseSensitive: false,
          },
        })}
      />
    )

    const labelInput = screen.getByPlaceholderText("conditionMatched")
    expect(screen.getByText("Evaluator Title")).toBeDefined()
    expect((labelInput as HTMLInputElement).value).toBe("conditionMatched")
  })

  it("commits Label via updateNodeConfig on blur", () => {
    render(<EvaluatorNode {...createNodeProps()} />)

    const labelInput = screen.getByPlaceholderText("conditionMatched")
    fireEvent.focus(labelInput)
    fireEvent.change(labelInput, { target: { value: "isQualified" } })
    fireEvent.blur(labelInput)

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "label",
      value: "isQualified",
    })
  })

  it("shows error and does not commit for invalid Label", () => {
    render(<EvaluatorNode {...createNodeProps()} />)

    const labelInput = screen.getByPlaceholderText("conditionMatched")
    fireEvent.focus(labelInput)
    fireEvent.change(labelInput, { target: { value: "bad label!" } })
    fireEvent.blur(labelInput)

    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()
    expect(screen.getByText("Label must be a valid JavaScript identifier.")).toBeDefined()
  })

  it("shows or hides the target input from operator metadata", () => {
    const rendered = render(<EvaluatorNode {...createNodeProps()} />)

    expect(screen.getByLabelText("target value")).toBeTruthy()

    rendered.rerender(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                value: "{{ source }}",
                operator: "is empty",
                targetValue: "{{ target }}",
              },
            ],
            logicalOperator: "and",
          },
        })}
      />
    )

    expect(screen.queryByLabelText("target value")).toBeNull()
  })

  it("uses the active runtime catalog when adding a new condition", () => {
    mockEnableEvaluatorMultipleConditions = true
    mockEvaluatorOperators = [
      { id: "matches", value: "Matches", requiresTarget: true },
      { id: "missing", value: "Is Missing", requiresTarget: false },
    ]

    render(<EvaluatorNode {...createNodeProps()} />)

    fireEvent.click(screen.getByRole("button", { name: /\+ Add Condition/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "conditions",
      value: [
        {
          id: "condition-1",
          value: "{{ source }}",
          operator: "is equal to",
          targetValue: "{{ target }}",
        },
        {
          id: "00000000-0000-0000-0000-000000000001",
          value: "",
          operator: "matches",
          targetValue: "",
        },
      ],
    })
  })

  it("renders Case sensitive checkbox before conditions", () => {
    render(<EvaluatorNode {...createNodeProps()} />)

    const valueInput = screen.getByLabelText("value")
    const caseSensitiveCheckbox = screen.getByRole("checkbox", {
      name: /Case sensitive/i,
    })

    expect(
      caseSensitiveCheckbox.compareDocumentPosition(valueInput) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("updates caseSensitive config when Case sensitive checkbox toggles", () => {
    render(<EvaluatorNode {...createNodeProps()} />)

    fireEvent.click(screen.getByRole("checkbox", { name: /Case sensitive/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "caseSensitive",
      value: true,
    })
  })

  it("keeps unknown stored operators editable by adding a fallback option", () => {
    mockEvaluatorOperators = [
      { id: "matches", value: "Matches", requiresTarget: true },
    ]

    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                value: "{{ source }}",
                operator: "legacy-op",
                targetValue: "",
              },
            ],
            logicalOperator: "and",
          },
        })}
      />
    )

    const operatorSelect = screen.getByLabelText(
      "Condition operator"
    ) as HTMLSelectElement

    expect(operatorSelect.value).toBe("legacy-op")
    expect(screen.getByRole("option", { name: "legacy-op" })).toBeTruthy()
    expect(screen.getByLabelText("target value")).toBeTruthy()
  })

  it("hides multi-condition controls and renders only the first condition by default", () => {
    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                value: "{{ first }}",
                operator: "is equal to",
                targetValue: "{{ target }}",
              },
              {
                id: "condition-2",
                value: "{{ second }}",
                operator: "is empty",
                targetValue: "",
              },
            ],
            logicalOperator: "or",
          },
        })}
      />
    )

    expect(
      screen.queryByRole("button", { name: /\+ Add Condition/i })
    ).toBeNull()
    expect(screen.queryByLabelText("Logical operator")).toBeNull()
    expect(screen.getByDisplayValue("{{ first }}")).toBeTruthy()
    expect(screen.queryByDisplayValue("{{ second }}")).toBeNull()
  })

  it("preserves hidden conditions when editing the first condition", () => {
    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                value: "{{ first }}",
                operator: "is equal to",
                targetValue: "{{ target }}",
              },
              {
                id: "condition-2",
                value: "{{ second }}",
                operator: "is empty",
                targetValue: "",
              },
            ],
            logicalOperator: "or",
          },
        })}
      />
    )

    fireEvent.change(screen.getByLabelText("value"), {
      target: { value: "{{ changed }}" },
    })

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "conditions",
      value: [
        {
          id: "condition-1",
          value: "{{ changed }}",
          operator: "is equal to",
          targetValue: "{{ target }}",
        },
        {
          id: "condition-2",
          value: "{{ second }}",
          operator: "is empty",
          targetValue: "",
        },
      ],
    })
  })
})
