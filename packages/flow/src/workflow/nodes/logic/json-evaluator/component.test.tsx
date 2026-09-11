// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { NodeProps } from "@xyflow/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { WorkflowEvaluatorOperatorCatalog } from "../../../types"
import { JsonEvaluatorNode } from "./component"

const mockUpdateNodeConfig = vi.fn()

const mockEvaluatorOperators: WorkflowEvaluatorOperatorCatalog = {
  value: [
    { id: "is equal to", value: "is equal to", allowTypes: ["value"] },
    { id: "is empty", value: "is empty", allowTypes: ["none"] },
  ],
  array: [{ id: "contains", value: "contains", allowTypes: ["value"] }],
}

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock("@flow/ui/components/sortable", () => ({
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

// The select's choices come from the store (`runtime.nodeOptions`); these
// suites render the node without a provider, so the hook is stubbed to hand
// back the built-in list the component passes as its fallback.
vi.mock("../../shared/use-node-select-options", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../shared/use-node-select-options")
  >()

  return {
    ...actual,
    useNodeSelectOptions: (
      _kind: string,
      _configKey: string,
      fallbackOptions: readonly { value: string; label: string }[]
    ) => fallbackOptions,
  }
})

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
    expressionVariableTypes: {},
    evaluatorOperators: mockEvaluatorOperators,
    enableEvaluatorMultipleConditions: true,
    updateNodeConfig: mockUpdateNodeConfig,
  }),
}))

function createNodeProps(config?: Record<string, unknown>): NodeProps {
  return {
    id: "json-evaluator-node-1",
    type: "jsonEvaluator",
    data: {
      kind: "jsonEvaluator",
      label: "",
      config: {
        label: "",
        conditions: [
          {
            id: "condition-1",
            left: { type: "value", value: "" },
            operator: "is equal to",
            right: { type: "value", value: "" },
          },
        ],
        logicalOperator: "and",
        caseSensitive: false,
        matchType: "any",
        ...config,
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

describe("JsonEvaluatorNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("renders the evaluator body plus a match type select", () => {
    render(<JsonEvaluatorNode {...createNodeProps()} />)

    expect(screen.getByText("JSON Evaluator")).toBeDefined()
    expect(screen.getByLabelText("Condition operator")).toBeDefined()
    expect(screen.getByLabelText("Match type").textContent).toContain(
      "Any match"
    )
  })

  it("falls back to the default match type for an unknown stored value", () => {
    render(<JsonEvaluatorNode {...createNodeProps({ matchType: "nope" })} />)

    expect(screen.getByLabelText("Match type").textContent).toContain(
      "Any match"
    )
  })

  it("commits the selected match type", async () => {
    const user = userEvent.setup()
    render(<JsonEvaluatorNode {...createNodeProps()} />)

    await user.click(screen.getByLabelText("Match type"))
    await user.click(
      await screen.findByRole("option", { name: "Only one match" })
    )

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("json-evaluator-node-1", {
      kind: "jsonEvaluator",
      key: "matchType",
      value: "one",
    })
  })

  it("commits condition changes under the jsonEvaluator kind", () => {
    render(<JsonEvaluatorNode {...createNodeProps()} />)

    expect(screen.getByText("1 condition")).toBeDefined()
    expect(mockUpdateNodeConfig).not.toHaveBeenCalled()
  })
})
