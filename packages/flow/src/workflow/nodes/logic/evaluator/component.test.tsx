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

function stringCondition(
  id: string,
  value: string,
  operator: string,
  targetValue?: string
) {
  return {
    id,
    left: { type: "string" as const, value },
    operator,
    ...(targetValue === undefined
      ? {}
      : { right: { type: "string" as const, value: targetValue } }),
  }
}

function selectWorkflowType(label: string, type: "string" | "array") {
  fireEvent.click(screen.getByLabelText(label))
  fireEvent.click(screen.getByRole("option", { name: type }))
}

function closeArrayPopover(label: string) {
  fireEvent.click(screen.getByLabelText(label))
}

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
          stringCondition(
            "condition-1",
            "{{ source }}",
            "is equal to",
            "{{ target }}"
          ),
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
              stringCondition(
                "condition-1",
                "{{ source }}",
                "matches",
                "{{ target }}"
              ),
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
        stringCondition("condition-1", "{{ source }}", "missing"),
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
              stringCondition(
                "condition-1",
                "{{ source }}",
                "is equal to",
                "{{ target }}"
              ),
              stringCondition("condition-2", "{{ other }}", "is empty"),
              stringCondition("condition-3", "{{ final }}", "is empty"),
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
              stringCondition(
                "condition-1",
                "{{ source }}",
                "is equal to",
                "{{ target }}"
              ),
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
              stringCondition("condition-1", "{{ source }}", "is empty"),
            ],
            logicalOperator: "and",
          },
        })}
      />
    )

    expect(screen.queryByLabelText("target value")).toBeNull()
  })

  it("updates left and right operand types independently", () => {
    render(<EvaluatorNode {...createNodeProps()} />)

    selectWorkflowType("Left operand type", "array")

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "conditions",
      value: [
        {
          ...stringCondition(
            "condition-1",
            "{{ source }}",
            "is equal to",
            "{{ target }}"
          ),
          left: { type: "array", value: ["{{ source }}"] },
        },
      ],
    })

    selectWorkflowType("Right operand type", "array")

    expect(mockUpdateNodeConfig).toHaveBeenLastCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "conditions",
      value: [
        {
          ...stringCondition(
            "condition-1",
            "{{ source }}",
            "is equal to",
            "{{ target }}"
          ),
          right: { type: "array", value: ["{{ target }}"] },
        },
      ],
    })
  })

  it("edits array operands from a compact popover", () => {
    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                left: { type: "array", value: ["first value"] },
                operator: "is equal to",
                right: { type: "array", value: ["target value"] },
              },
            ],
            label: "conditionMatched",
            logicalOperator: "and",
            caseSensitive: false,
          },
        })}
      />
    )

    expect(screen.getByText("first value")).toBeDefined()
    expect(screen.queryByText("value")).toBeNull()
    fireEvent.click(screen.getByLabelText("Edit Left array values"))

    fireEvent.change(screen.getByLabelText("Left array value 1"), {
      target: { value: "New York value" },
    })
    expect(screen.getByText("New York value")).toBeDefined()
    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()

    closeArrayPopover("Edit Left array values")

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "conditions",
      value: [
        {
          id: "condition-1",
          left: { type: "array", value: ["New York value"] },
          operator: "is equal to",
          right: { type: "array", value: ["target value"] },
        },
      ],
    })

    fireEvent.click(screen.getByLabelText("Edit Left array values"))
    fireEvent.click(screen.getByRole("button", { name: /Add value/i }))
    fireEvent.change(screen.getByLabelText("Left array value 2"), {
      target: { value: "second value" },
    })
    closeArrayPopover("Edit Left array values")

    expect(mockUpdateNodeConfig).toHaveBeenLastCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "conditions",
      value: [
        {
          id: "condition-1",
          left: { type: "array", value: ["first value", "second value"] },
          operator: "is equal to",
          right: { type: "array", value: ["target value"] },
        },
      ],
    })
  })

  it("shows up to three non-empty array preview chips with an overflow badge", () => {
    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                left: {
                  type: "array",
                  value: [
                    "first long value",
                    "",
                    "second value",
                    "third value",
                    "fourth value",
                    "fifth value",
                  ],
                },
                operator: "is equal to",
                right: { type: "string", value: "{{ target }}" },
              },
            ],
            label: "conditionMatched",
            logicalOperator: "and",
            caseSensitive: false,
          },
        })}
      />
    )

    const firstChip = screen.getByText("first long value")

    expect(firstChip).toBeDefined()
    expect(firstChip.className).toContain("truncate")
    expect(screen.getByText("second value")).toBeDefined()
    expect(screen.getByText("third value")).toBeDefined()
    expect(screen.queryByText("fourth value")).toBeNull()
    expect(screen.queryByText("fifth value")).toBeNull()
    expect(screen.getByText("+2")).toBeDefined()
  })

  it("shows the array placeholder when all preview values are empty", () => {
    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                left: { type: "array", value: ["", ""] },
                operator: "is equal to",
                right: { type: "string", value: "{{ target }}" },
              },
            ],
            label: "conditionMatched",
            logicalOperator: "and",
            caseSensitive: false,
          },
        })}
      />
    )

    expect(screen.getByText("value")).toBeDefined()
    expect(screen.queryByText("+1")).toBeNull()
  })

  it("keeps one empty input when deleting the last array value", () => {
    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                left: { type: "array", value: ["first value"] },
                operator: "is equal to",
                right: { type: "array", value: ["target value"] },
              },
            ],
            label: "conditionMatched",
            logicalOperator: "and",
            caseSensitive: false,
          },
        })}
      />
    )

    fireEvent.click(screen.getByLabelText("Edit Left array values"))
    fireEvent.click(screen.getByLabelText("Delete Left array value 1"))
    expect(
      (screen.getByLabelText("Left array value 1") as HTMLInputElement).value
    ).toBe("")
    closeArrayPopover("Edit Left array values")

    expect(mockUpdateNodeConfig).toHaveBeenLastCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "conditions",
      value: [
        {
          id: "condition-1",
          left: { type: "array", value: [""] },
          operator: "is equal to",
          right: { type: "array", value: ["target value"] },
        },
      ],
    })
  })

  it("keeps the first array item when changing an array operand to string", () => {
    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              {
                id: "condition-1",
                left: { type: "array", value: ["first", "second"] },
                operator: "is equal to",
                right: { type: "string", value: "{{ target }}" },
              },
            ],
            label: "conditionMatched",
            logicalOperator: "and",
            caseSensitive: false,
          },
        })}
      />
    )

    selectWorkflowType("Left operand type", "string")

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "conditions",
      value: [
        {
          id: "condition-1",
          left: { type: "string", value: "first" },
          operator: "is equal to",
          right: { type: "string", value: "{{ target }}" },
        },
      ],
    })
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
        stringCondition(
          "condition-1",
          "{{ source }}",
          "is equal to",
          "{{ target }}"
        ),
        {
          id: "00000000-0000-0000-0000-000000000001",
          left: { type: "string", value: "" },
          operator: "matches",
          right: { type: "string", value: "" },
        },
      ],
    })
  })

  it("creates a default right operand when switching to a target-required operator", () => {
    mockEvaluatorOperators = [
      { id: "matches", value: "Matches", requiresTarget: true },
      { id: "missing", value: "Is Missing", requiresTarget: false },
    ]

    render(
      <EvaluatorNode
        {...createNodeProps({
          config: {
            conditions: [
              stringCondition("condition-1", "{{ source }}", "missing"),
            ],
            label: "conditionMatched",
            logicalOperator: "and",
            caseSensitive: false,
          },
        })}
      />
    )

    fireEvent.change(screen.getByLabelText("Condition operator"), {
      target: { value: "matches" },
    })

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("evaluator-node-1", {
      kind: "evaluator",
      key: "conditions",
      value: [
        {
          id: "condition-1",
          left: { type: "string", value: "{{ source }}" },
          operator: "matches",
          right: { type: "string", value: "" },
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
              stringCondition("condition-1", "{{ source }}", "legacy-op", ""),
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
              stringCondition(
                "condition-1",
                "{{ first }}",
                "is equal to",
                "{{ target }}"
              ),
              stringCondition("condition-2", "{{ second }}", "is empty"),
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
              stringCondition(
                "condition-1",
                "{{ first }}",
                "is equal to",
                "{{ target }}"
              ),
              stringCondition("condition-2", "{{ second }}", "is empty"),
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
        stringCondition(
          "condition-1",
          "{{ changed }}",
          "is equal to",
          "{{ target }}"
        ),
        stringCondition("condition-2", "{{ second }}", "is empty"),
      ],
    })
  })
})
