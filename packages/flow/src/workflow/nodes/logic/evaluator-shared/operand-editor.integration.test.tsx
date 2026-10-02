// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { WorkflowOperandValue } from "../../../types"
import { OperandEditor } from "./operand-editor"

/**
 * CodeMirror cannot run in jsdom, so a textarea stands in for it. Everything
 * above it is real: the expression editor and the array popover the rows live
 * in. The path goes through the expression editor's own dependency, since that
 * is the module it imports. Picking from the variable picker needs a real
 * browser and is covered by `apps/web/e2e/evaluator-array-operand.spec.ts`.
 */
vi.mock(
  "../../../../../../expression-editor/node_modules/@uiw/react-codemirror/esm/index.js",
  () => ({
    default: function MockCodeMirror({
      value,
      onChange,
    }: {
      value: string
      onChange: (
        nextValue: string,
        viewUpdate: {
          state: { selection: { main: { head: number } } }
          startState: {
            doc: { toString: () => string }
            selection: { main: { head: number } }
          }
        }
      ) => void
    }) {
      return (
        <textarea
          aria-label="expression row"
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value
            onChange(nextValue, {
              state: { selection: { main: { head: nextValue.length } } },
              startState: {
                doc: { toString: () => value },
                selection: { main: { head: value.length } },
              },
            })
          }}
        />
      )
    },
  })
)

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
    const row = within(group).getByLabelText("expression row")
    fireEvent.change(row, { target: { value: "Paris-live" } })

    expect(handleChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText("Edit Left array values"))

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith({
      type: "array",
      value: ["Paris-live"],
    })
  })
})
