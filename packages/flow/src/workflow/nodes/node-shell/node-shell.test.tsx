// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { NodeShell } from "./node-shell"

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

vi.mock("@workspace/ui/components/tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="node-validation-tooltip">{children}</div>
  ),
}))

describe("NodeShell validation display", () => {
  afterEach(() => {
    cleanup()
  })

  it("marks nodes with visible validation and exposes all messages", () => {
    render(
      <NodeShell
        nodeId="node-1"
        title="Keyword"
        subtitle=""
        selected
        validationMessages={[
          {
            key: "node-1:first",
            nodeId: "node-1",
            message: "First node problem.",
            severity: "error",
          },
          {
            key: "node-1:second",
            nodeId: "node-1",
            message: "Second node problem.",
            severity: "warning",
          },
        ]}
      />
    )

    expect(screen.getByTestId("workflow-node").dataset.validation).toBe("true")
    expect(screen.getByTestId("node-validation-indicator")).toBeTruthy()
    expect(screen.getByText("First node problem.")).toBeTruthy()
    expect(screen.getByText("Second node problem.")).toBeTruthy()
  })

  it("does not render validation affordance when there are no messages", () => {
    render(<NodeShell nodeId="node-1" title="Keyword" subtitle="" />)

    expect(screen.getByTestId("workflow-node").dataset.validation).toBe("false")
    expect(screen.queryByTestId("node-validation-indicator")).toBeNull()
  })
})
