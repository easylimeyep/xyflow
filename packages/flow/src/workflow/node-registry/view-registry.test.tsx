// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { workflowNodeKinds, type NodeKind } from "./registry"
import { listNodeViews } from "./view-registry"

describe("workflow node view registry", () => {
  it("binds custom components only for valid node kinds", () => {
    const validKinds = new Set<string>(workflowNodeKinds())

    for (const kind of Object.keys(listNodeViews())) {
      expect(validKinds.has(kind)).toBe(true)
    }
  })

  it("covers all currently custom-rendered workflow nodes", () => {
    expect(Object.keys(listNodeViews()).sort()).toEqual(
      [...workflowNodeKinds()].sort()
    )
  })

  it("exposes React component functions for each binding", () => {
    for (const kind of workflowNodeKinds()) {
      expect(typeof listNodeViews()[kind as NodeKind]).toBe("function")
    }
  })
})
