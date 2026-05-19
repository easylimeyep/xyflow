// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArrayInputPopover } from "./array-input-popover.js"

afterEach(() => {
  cleanup()
})

function ControlledArrayInputPopover({
  initialValues,
}: {
  initialValues: string[]
}) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(initialValues)

  return (
    <ArrayInputPopover
      open={open}
      values={values}
      label="Left"
      placeholder="value"
      onOpenChange={setOpen}
      onValuesChange={setValues}
    />
  )
}

describe("ArrayInputPopover", () => {
  it("shows up to three non-empty preview chips with an overflow badge", () => {
    render(
      <ArrayInputPopover
        open={false}
        values={[
          "first long value",
          "",
          "second value",
          "third value",
          "fourth value",
          "fifth value",
        ]}
        label="Left"
        placeholder="value"
        onOpenChange={() => undefined}
        onValuesChange={() => undefined}
      />
    )

    expect(screen.getByText("first long value")).toBeDefined()
    expect(screen.getByText("second value")).toBeDefined()
    expect(screen.getByText("third value")).toBeDefined()
    expect(screen.queryByText("fourth value")).toBeNull()
    expect(screen.queryByText("fifth value")).toBeNull()
    expect(screen.getByText("+2")).toBeDefined()
  })

  it("shows the placeholder when all preview values are empty", () => {
    render(
      <ArrayInputPopover
        open={false}
        values={["", ""]}
        label="Left"
        placeholder="value"
        onOpenChange={() => undefined}
        onValuesChange={() => undefined}
      />
    )

    expect(
      screen.getByLabelText("Edit Left array values").textContent
    ).toContain("value")
    expect(screen.queryByText("+1")).toBeNull()
  })

  it("updates rows and supports adding and deleting values", () => {
    render(<ControlledArrayInputPopover initialValues={["first value"]} />)

    fireEvent.click(screen.getByLabelText("Edit Left array values"))
    fireEvent.change(screen.getByLabelText("Left array value 1"), {
      target: { value: "New York value" },
    })

    expect(
      (screen.getByLabelText("Left array value 1") as HTMLInputElement).value
    ).toBe("New York value")
    expect(screen.getByText("New York value")).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: /Add value/i }))
    fireEvent.change(screen.getByLabelText("Left array value 2"), {
      target: { value: "second value" },
    })

    expect(
      (screen.getByLabelText("Left array value 2") as HTMLInputElement).value
    ).toBe("second value")

    fireEvent.click(screen.getByLabelText("Delete Left array value 1"))

    expect(screen.queryByLabelText("Left array value 2")).toBeNull()
    expect(
      (screen.getByLabelText("Left array value 1") as HTMLInputElement).value
    ).toBe("second value")
  })

  it("calls controlled callbacks with plain string arrays", () => {
    const handleOpenChange = vi.fn()
    const handleValuesChange = vi.fn()

    render(
      <ArrayInputPopover
        open={true}
        values={["first"]}
        label="Left"
        placeholder="value"
        onOpenChange={handleOpenChange}
        onValuesChange={handleValuesChange}
      />
    )

    fireEvent.change(screen.getByLabelText("Left array value 1"), {
      target: { value: "updated" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Add value/i }))
    fireEvent.click(screen.getByLabelText("Delete Left array value 1"))
    fireEvent.click(screen.getByLabelText("Edit Left array values"))

    expect(handleValuesChange).toHaveBeenNthCalledWith(1, ["updated"])
    expect(handleValuesChange).toHaveBeenNthCalledWith(2, ["first", ""])
    expect(handleValuesChange).toHaveBeenNthCalledWith(3, [])
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })
})
