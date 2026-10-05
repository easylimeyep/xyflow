// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import { appendExpressionText } from "@flow/expression-editor/testing"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { WorkflowOperandValue } from "../../../types"
import { OperandEditor } from "./operand-editor"

/**
 * Everything here is real: the expression editor, its CodeMirror view and the
 * array popover the rows live in. jsdom cannot type into CodeMirror, so the
 * expression editor's test helpers edit the view directly. Picking from the
 * variable picker needs a real browser and is covered by
 * `apps/web/e2e/evaluator-array-operand.spec.ts`.
 */
function ArrayOperandHarness({
  onChange,
}: {
  onChange: (operand: WorkflowOperandValue) => void
}) {
  const [operand, setOperand] = useState<WorkflowOperandValue>({
    type: "array",
    value: ["Paris"],
  })

  return (
    <OperandEditor
      operand={operand}
      label="Left"
      placeholder="value"
      variables={[]}
      variableTypes={{}}
      onChange={(nextOperand) => {
        setOperand(nextOperand)
        onChange(nextOperand)
      }}
    />
  )
}

describe("OperandEditor array rows with the real expression editor", () => {
  afterEach(() => {
    cleanup()
  })

  it("commits text typed into a row that never lost focus", () => {
    const handleChange = vi.fn()
    render(<ArrayOperandHarness onChange={handleChange} />)

    fireEvent.click(screen.getByLabelText("Edit Left array values"))
    const group = screen.getByRole("group", { name: "Left array value 1" })
    // Rows draw a static preview until pressed, like every canvas field.
    fireEvent.pointerDown(within(group).getByRole("textbox"))
    act(() => {
      appendExpressionText(group, "-live")
    })

    expect(handleChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText("Edit Left array values"))

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith({
      type: "array",
      value: ["Paris-live"],
    })
  })
})
