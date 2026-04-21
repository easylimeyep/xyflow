// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { NodeProps } from "@xyflow/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { WorkflowBranchOperatorOption } from "../../types"
import { BranchNode } from "./branch-node"

const mockUpdateNodeConfig = vi.fn()

let mockBranchOperators: WorkflowBranchOperatorOption[] = [
  { id: "is equal to", value: "is equal to", requiresTarget: true },
  { id: "is empty", value: "is empty", requiresTarget: false },
]

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: {
    Left: "left",
    Right: "right",
  },
}))

vi.mock("@workspace/ui/components/select", async () => {
  const React = await vi.importActual<typeof import("react")>("react")
  const SelectContext = React.createContext<((value: string) => void) | null>(null)

  return {
    Select: ({
      onValueChange,
      children,
    }: {
      value?: string
      onValueChange?: (value: string) => void
      children?: ReactNode
    }) => (
      <SelectContext.Provider value={onValueChange ?? null}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    SelectItem: ({
      value,
      children,
      className,
    }: {
      value: string
      children?: ReactNode
      className?: string
    }) => {
      const onValueChange = React.useContext(SelectContext)
      return (
        <button
          type="button"
          data-testid={`select-item-${value}`}
          className={className}
          onClick={() => onValueChange?.(value)}
        >
          {children}
        </button>
      )
    },
  }
})

vi.mock("@workspace/ui/components/sortable", () => ({
  Sortable: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SortableContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SortableItem: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SortableItemHandle: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SortableOverlay: () => null,
}))

vi.mock("../../components/expression-input", () => ({
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

vi.mock("../node-shell/node-shell", () => ({
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

vi.mock("../shared/use-node-store-data", () => ({
  useNodeStoreData: () => ({
    expressionVariables: [],
    branchOperators: mockBranchOperators,
    updateNodeConfig: mockUpdateNodeConfig,
  }),
}))

function createNodeProps(
  overrides?: Partial<NodeProps["data"] & { config: Record<string, unknown> }>
): NodeProps {
  return {
    id: "branch-node-1",
    type: "branch",
    data: {
      kind: "branch",
      label: "Branch",
      config: {
        conditions: [
          {
            id: "condition-1",
            value: "{{ source }}",
            operator: "is equal to",
            targetValue: "{{ target }}",
          },
        ],
        logicalOperator: "and",
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

describe("BranchNode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBranchOperators = [
      { id: "is equal to", value: "is equal to", requiresTarget: true },
      { id: "is empty", value: "is empty", requiresTarget: false },
    ]
    vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("00000000-0000-0000-0000-000000000001")
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("renders runtime-provided operator labels and updates the stored operator id", () => {
    mockBranchOperators = [
      { id: "matches", value: "Matches", requiresTarget: true },
      { id: "missing", value: "Is Missing", requiresTarget: false },
    ]

    render(
      <BranchNode
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
            logicalOperator: "and",
          },
        })}
      />
    )

    expect(screen.getByTestId("select-item-matches").textContent).toBe("Matches")
    expect(screen.getByTestId("select-item-missing").textContent).toBe("Is Missing")

    fireEvent.click(screen.getByTestId("select-item-missing"))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("branch-node-1", {
      kind: "branch",
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

  it("shows or hides the target input from operator metadata", () => {
    const rendered = render(<BranchNode {...createNodeProps()} />)

    expect(screen.getByLabelText("target value")).toBeTruthy()

    rendered.rerender(
      <BranchNode
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
    mockBranchOperators = [
      { id: "matches", value: "Matches", requiresTarget: true },
      { id: "missing", value: "Is Missing", requiresTarget: false },
    ]

    render(<BranchNode {...createNodeProps()} />)

    fireEvent.click(screen.getByRole("button", { name: /\+ Add Condition/i }))

    expect(mockUpdateNodeConfig).toHaveBeenCalledWith("branch-node-1", {
      kind: "branch",
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

  it("keeps unknown stored operators editable by adding a fallback option", () => {
    mockBranchOperators = [
      { id: "matches", value: "Matches", requiresTarget: true },
    ]

    render(
      <BranchNode
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

    expect(screen.getByTestId("select-item-legacy-op").textContent).toBe("legacy-op")
    expect(screen.getByLabelText("target value")).toBeTruthy()
  })
})
