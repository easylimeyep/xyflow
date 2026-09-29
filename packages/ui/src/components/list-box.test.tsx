// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import {
  ListBox,
  ListBoxHeader,
  ListBoxItem,
  ListBoxSection,
} from "./list-box.js"

afterEach(() => {
  cleanup()
})

describe("ListBox", () => {
  it("renders sections whose headers are not options", () => {
    render(
      <ListBox aria-label="Results" selectionMode="single" selectedKeys={["b"]}>
        <ListBoxSection id="group">
          <ListBoxHeader>Group</ListBoxHeader>
          <ListBoxItem id="a">Alpha</ListBoxItem>
          <ListBoxItem id="b">Beta</ListBoxItem>
        </ListBoxSection>
      </ListBox>
    )

    expect(screen.getByRole("listbox", { name: "Results" })).toBeTruthy()
    expect(screen.getByRole("group")).toBeTruthy()
    const options = screen.getAllByRole("option")
    expect(options.map((option) => option.textContent)).toEqual([
      "Alpha",
      "Beta",
    ])
    expect(options[1]!.getAttribute("aria-selected")).toBe("true")
    expect(options[0]!.getAttribute("aria-selected")).toBe("false")
  })
})
