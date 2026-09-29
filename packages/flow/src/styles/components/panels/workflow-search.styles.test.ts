import { describe, expect, it } from "vitest"

import { workflowSearchStyles } from "./workflow-search.styles"

const rootOf = (options: Parameters<typeof workflowSearchStyles>[0]) =>
  workflowSearchStyles(options).root().split(" ")

describe("workflowSearchStyles positions", () => {
  it("pins the bar to the top-right by default", () => {
    expect(rootOf({})).toEqual(expect.arrayContaining(["top-3", "right-14"]))
  })

  it.each([
    ["top-left", ["top-3", "left-3"]],
    ["top-center", ["top-3", "left-1/2", "-translate-x-1/2"]],
    ["center-left", ["top-1/2", "-translate-y-1/2", "left-3"]],
    ["center-right", ["top-1/2", "-translate-y-1/2", "right-3"]],
    ["bottom-center", ["bottom-3", "left-[max(calc(15rem+220px),50%)]", "-translate-x-1/2"]],
    ["bottom-right", ["bottom-3", "right-3"]],
  ] as const)("places %s", (position, classes) => {
    expect(rootOf({ position })).toEqual(expect.arrayContaining([...classes]))
  })

  it("opens the results upwards along the bottom edge only", () => {
    for (const position of [
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ] as const) {
      expect(rootOf({ position })).toContain("flex-col-reverse")
    }
    for (const position of ["top-left", "center-right"] as const) {
      expect(rootOf({ position })).not.toContain("flex-col-reverse")
    }
  })

  it("moves clear of the open palette only on the right edge", () => {
    const beside = "@2xl:right-[19.5rem]"
    expect(rootOf({ position: "bottom-right", besidePalette: true })).toContain(
      beside
    )
    expect(rootOf({ position: "top-left", besidePalette: true })).not.toContain(
      beside
    )
  })

  it("ignores the position when rendered inline", () => {
    expect(
      rootOf({ placement: "inline", position: "bottom-left" })
    ).not.toContain("bottom-3")
  })
})
