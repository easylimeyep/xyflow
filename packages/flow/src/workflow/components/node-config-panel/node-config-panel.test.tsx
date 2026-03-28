// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createWorkflowNode } from "../../node-registry"
import type { ExpressionVariableOption } from "../../types"
import { NodeConfigPanel } from "./node-config-panel"

vi.mock("../expression-input", () => ({
  ExpressionInput: ({
    value,
    variables,
    onChange,
  }: {
    value: string
    variables: ExpressionVariableOption[]
    onChange: (value: string) => void
  }) => (
    <button
      type="button"
      data-testid="expression-input-mock"
      onClick={() => onChange(`${value}{{ ${variables[0]?.value ?? "$input.item.json"} }}`)}
    >
      expression-input
    </button>
  ),
}))

describe("NodeConfigPanel expression integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updates config field when expression variable is inserted", async () => {
    const user = userEvent.setup()
    const node = createWorkflowNode("customInput", { x: 50, y: 50 }, "CustomInputA")
    const onUpdateConfigField = vi.fn()
    const variables: ExpressionVariableOption[] = [
      {
        value: '$node("trigger-a").item.json.eventName',
        label: '$node("trigger-a").item.json.eventName',
        description: "Trigger field",
        group: "Upstream: TriggerA",
      },
    ]

    render(
      <NodeConfigPanel
        selectedNode={node}
        expressionVariables={variables}
        onUpdateLabel={vi.fn()}
        onUpdateConfigField={onUpdateConfigField}
      />
    )

    await user.click(screen.getByTestId("expression-input-mock"))

    expect(onUpdateConfigField).toHaveBeenCalledWith(
      node.id,
      "inputText",
      expect.stringContaining('{{ $node("trigger-a").item.json.eventName }}')
    )
  })
})
