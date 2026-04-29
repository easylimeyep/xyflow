// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { WORKFLOW_NODE_KINDS, type NodeKind } from "./registry"
import { nodeComponents } from "./view-registry"

describe("workflow node view registry", () => {
  it("binds custom components only for valid node kinds", () => {
    const validKinds = new Set<string>(WORKFLOW_NODE_KINDS)

    for (const kind of Object.keys(nodeComponents)) {
      expect(validKinds.has(kind)).toBe(true)
    }
  })

  it("covers all currently custom-rendered workflow nodes", () => {
    expect(Object.keys(nodeComponents).sort()).toEqual(
      [...WORKFLOW_NODE_KINDS].sort()
    )
  })

  it("exposes React component functions for each binding", () => {
    for (const kind of WORKFLOW_NODE_KINDS) {
      expect(typeof nodeComponents[kind as NodeKind]).toBe("function")
    }
  })
})
